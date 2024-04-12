import type { DomainEvent } from "../../events/domain.event";
import type { DomainEventEmitter } from "../../events/event-emitter.events";
import type { EventStore } from "../../events/event-store.events";
import type {
	RepositoryCreatedEvent,
	RepositoryDeletedEvent,
	RepositoryUpdatedEvent,
} from "../../events/repository.events";
import type { RepositoryDashboardReadModel } from "../../models/read-models/repository.read-model";
import type { ReadModelStore } from "./read-model.store";

export class ReadModelProjector {
	// Ignore this since it's set up by the setup function
	private uploadTimer!: NodeJS.Timeout;
	private lastUploadTime: Date;
	private readonly uploadThreshold = 10_000; // 10 seconds
	private cache: {
		[key: string]: {
			data: RepositoryDashboardReadModel | undefined;
			timestamp: number;
		};
	};
	private readonly eventStore: EventStore;
	private readonly domainEventEmitter: DomainEventEmitter;
	private readonly readModelStore: ReadModelStore<
		Record<number, RepositoryDashboardReadModel>
	>;

	constructor(
		eventStore: EventStore,
		domainEventEmitter: DomainEventEmitter,
		readModelStore: ReadModelStore<
			Record<number, RepositoryDashboardReadModel>
		>,
	) {
		this.eventStore = eventStore;
		this.domainEventEmitter = domainEventEmitter;
		this.readModelStore = readModelStore;

		this.lastUploadTime = new Date();
		this.cache = Object.create(null);
		this.setupUploadTimer();
	}

	async rebuildReadModel() {
		console.info("Rebuilding read model...");
		// Fetch all events from the EventStore
		const events = await this.eventStore.getAllEvents();

		// Update the cache
		for (const event of events) {
			console.info("Update cache:", event.type);

			if (this.isSpecificEventType(event)) {
				await this.handleEvent(event);
			}
		}

		console.info("Read model rebuilt.");
		console.info("Read model: ", this.readModelStore.getReadModel());
	}

	async forceUpload() {
		await this.rebuildReadModel();
		this.lastUploadTime = new Date();
	}

	private setupUploadTimer() {
		this.uploadTimer = setInterval(() => {
			const now = new Date();
			if (
				now.getTime() - this.lastUploadTime.getTime() >
				this.uploadThreshold
			) {
				console.info("Time threshold reached, triggering upload...");
				this.forceUpload();
			}
			// Check for stale cache entries
			console.info("Checking cache...");
			this.checkAndRemoveStaleCacheEntries();
		}, 5_000);
	}

	dispose() {
		if (this.uploadTimer) {
			clearInterval(this.uploadTimer);
		}
	}

	// Method to check and remove stale cache entries based on TTL
	private checkAndRemoveStaleCacheEntries() {
		const now = Date.now();
		const ttl = 30_000;
		for (const key in this.cache) {
			if (now - (this.cache[key]?.timestamp ?? 0) > ttl) {
				delete this.cache[key];
			}
		}
		console.info(
			`Removed ${
				Object.keys(this.cache).length -
				Object.keys(this.cache).filter((key) => this.cache[key]?.data).length
			} stale cache entries`,
		);
	}

	// Type guard to check if an event is one of the specific types
	private isSpecificEventType(
		event: DomainEvent,
	): event is
		| RepositoryCreatedEvent
		| RepositoryUpdatedEvent
		| RepositoryDeletedEvent {
		return (
			event.type === "RepositoryCreated" ||
			event.type === "RepositoryUpdated" ||
			event.type === "RepositoryDeleted"
		);
	}

	private async handleEvent(event: DomainEvent) {
		// Depending on the event type, update the read model accordingly
		switch (event.type) {
			case "RepositoryCreated": {
				await this.onRepositoryCreated(event as RepositoryCreatedEvent);
				break;
			}
			case "RepositoryUpdated": {
				await this.onRepositoryUpdated(event as RepositoryUpdatedEvent);
				break;
			}
			case "RepositoryDeleted": {
				await this.onRepositoryDeleted(event as RepositoryDeletedEvent);
				break;
			}
		}
	}

	private async onRepositoryCreated(event: RepositoryCreatedEvent) {
		const dashboardReadModel: RepositoryDashboardReadModel = {
			id: event.payload.repositoryId,
			owner: {
				connect: {
					id: event.payload.ownerId,
				},
			},
			name: event.payload.repositoryName,
			starCount: 0,
			ownerId: event.payload.ownerId,
			description: event.payload.description,
			primaryLanguage: null,
			visibility: event.payload.visibility,
		};

		// Update cache with data and current timestamp
		this.cache[event.payload.repositoryId] = {
			data: dashboardReadModel,
			timestamp: Date.now(),
		};

		await this.readModelStore.handleEvent(event);
	}

	private async onRepositoryUpdated(event: RepositoryUpdatedEvent) {
		// Retrieve the existing model from cache
		const existingModel = this.cache[event.payload.repositoryId];
		if (existingModel?.data) {
			const updatedModelData: RepositoryDashboardReadModel = {
				...existingModel.data,
				...event.payload.changes,
				// Ensure id is always a string
				id: event.payload.repositoryId,
			};

			// Update the model with new changes
			const updatedModel = {
				data: updatedModelData,
				timestamp: Date.now(),
			};

			// Update cache
			this.cache[event.payload.repositoryId] = updatedModel;
		}

		await this.readModelStore.handleEvent(event);
	}
	private async onRepositoryDeleted(event: RepositoryDeletedEvent) {
		// Invalidate cache
		delete this.cache[event.payload.repositoryId];

		await this.readModelStore.handleEvent(event);
	}
}
