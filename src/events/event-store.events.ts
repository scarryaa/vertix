import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	BatchWriteCommand,
	DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { BaseEntity } from "../models/base.model";
import type { SnapshotManager } from "../services/snapshot-manager/snapshot-manager.service";
import { compressEvent, decompressEvent } from "../utils/compresser";
import type { DomainEvent } from "./domain.event";
import type { CustomErrorEvent } from "./generic.events";
import type { RepositoryEvent } from "./repository.events";

export class EventStore {
	private dynamoDbClient: DynamoDBDocumentClient;
	private queuedEvents: DomainEvent[] = [];
	private retryCount = 0;
	private serviceName = "EventStore";
	private eventCountPerAggregate = new Map<string, number>();
	private aggregateToSnapshotManager = new Map<
		string,
		SnapshotManager<BaseEntity>
	>();
	private maxRetries = 3;
	private maxQueuedEvents = 25;

	constructor() {
		const client = new DynamoDBClient({
			region: process.env.AWS_REGION,
		});
		this.dynamoDbClient = DynamoDBDocumentClient.from(client, {
			marshallOptions: {
				removeUndefinedValues: true,
			},
		});
	}

	public async flushEvents(): Promise<void> {
		if (this.queuedEvents.length === 0) {
			return;
		}

		this.batchAppend(this.queuedEvents);
	}

	public async queueEventForProcessing(event: DomainEvent): Promise<void> {
		const aggregateId = (event.payload as BaseEntity).id;
		const snapshotManager = this.aggregateToSnapshotManager.get(aggregateId);

		this.queuedEvents.push(event);
		this.eventCountPerAggregate.set(
			aggregateId,
			(this.eventCountPerAggregate.get(aggregateId) || 0) + 1,
		);

		if (this.queuedEvents.length >= this.maxQueuedEvents) {
			await this.flushEvents();
			this.queuedEvents = [];
			this.retryCount = 0;
		}

		if (
			this.eventCountPerAggregate.get(aggregateId) === 10 &&
			snapshotManager
		) {
			snapshotManager.createSnapshot({
				id: aggregateId,
			});
		}
	}

	public async getAllEvents(): Promise<DomainEvent[]> {
		const params = {
			TableName: "RepositoryEvents",
		};
	
		try {
			const command = new ScanCommand(params);
			const result = await this.dynamoDbClient.send(command);
	
			if (result.Items) {
				// Use Promise.all to wait for all promises to resolve
				const events = await Promise.all(result.Items.map((item) =>
					this.mapDynamoDBItemToDomainEvent(item),
				));
	
				return events;
			}
	
			return [];
		} catch (error) {
			console.error("Error retrieving all events from DynamoDB", error);
			throw error;
		}
	}

	private async mapDynamoDBItemToDomainEvent(item: any): Promise<DomainEvent> {
		const decompressedPayload = await decompressEvent(item.payload);
		return {
			id: item.id,
			type: item.type,
			timestamp: new Date(item.timestamp),
			payload: decompressedPayload,
			userId: item.userId,
		};
	}

	private async batchAppend(events: DomainEvent[]): Promise<void> {
		console.info("Batching %d events", events.length);
		const batches = [];
		while (events.length) {
			const batch = events.splice(0, 25);
			batches.push(batch);
		}
	
		for (const batch of batches) {
			// Use Promise.all to wait for all compressEvent promises to resolve
			const writeRequestsPromises = batch.map(async (event) => {
				const compressedPayload = await compressEvent(event.payload);
				return {
					PutRequest: {
						Item: {
							id: event.id,
							type: event.type,
							timestamp: event.timestamp.getTime(),
							payload: compressedPayload,
							userId: event.userId,
							username: event.username,
						},
					},
				};
			});
	
			// Resolve all promises
			const writeRequests = await Promise.all(writeRequestsPromises);
	
			const params = {
				RequestItems: {
					RepositoryEvents: writeRequests,
				},
			};
	
			try {
				const response = await this.dynamoDbClient.send(new BatchWriteCommand(params));
				// Handle unprocessed items with delay
				if (response.UnprocessedItems?.RepositoryEvents && this.retryCount < 3) {
					const unprocessedItems = response.UnprocessedItems.RepositoryEvents;
					await this.retryUnprocessedItems(unprocessedItems);
					this.retryCount++;
					await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
				}
			} catch (error) {
				console.error("Error in batch appending events to DynamoDB", error);
				// Retry logic
				await this.retryUnprocessedItems(writeRequests);
				await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
				this.retryCount++;
			}
		}
	}

	private async retryUnprocessedItems(unprocessedItems: any[]): Promise<void> {
		if (this.retryCount >= this.maxRetries) {
			console.error("%s: Max retry count reached", this.serviceName);
			return;
		}

		// Calculate the delay using exponential backoff
		// Base delay is 1000 milliseconds
		const delay = 1000 * 2 ** this.retryCount;
		this.retryCount++;

		// Wait for the calculated delay before retrying
		await new Promise((resolve) => setTimeout(resolve, delay));

		// Prepare unprocessed items for retry
		const params = {
			RequestItems: {
				RepositoryEvents: unprocessedItems,
			},
		};

		try {
			const response = await this.dynamoDbClient.send(
				new BatchWriteCommand(params),
			);
			// Check again for unprocessed items
			if (response.UnprocessedItems?.RepositoryEvents) {
				// If there are still unprocessed items, apply exponential backoff before retrying again
				await this.retryUnprocessedItems(
					response.UnprocessedItems.RepositoryEvents,
				);
			}
		} catch (error) {
			console.error("Error retrying unprocessed items to DynamoDB", error);
			throw error;
		}
	}

	private isCustomErrorEvent(
		event: Error | CustomErrorEvent | RepositoryEvent<unknown> | DomainEvent,
	): event is CustomErrorEvent {
		return "errorDetails" in event;
	}
}
