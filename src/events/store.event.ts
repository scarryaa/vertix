import { randomUUID } from "node:crypto";
import type { Repository } from "typeorm";
import { BaseEvent, BasePayload } from ".";
import { AppDataSource } from "../data-source";
import { EventEntity } from "../entities/Event";

export class EventStore {
	// @TODO make a separare class for this?
	private repository: Repository<EventEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(EventEntity);
	}

	async logAllEvents(): Promise<void> {
		const events = await this.repository.find();
		for (const event of events) {
			console.log(event);
		}
	}

	async loadEventsForAggregate(aggregateId: string): Promise<BaseEvent<any>[]> {
		const events = await this.repository.find({
			where: {
				aggregateId,
			},
		});

		return events.map((event) => {
			return new BaseEvent(
				event.aggregateId,
				event.id,
				event.eventType,
				JSON.parse(event.payload),
			);
		});
	}

	async loadAllEventsOfType(eventType: string): Promise<BaseEvent<any>[]> {
		const events = await this.repository.find({
			where: {
				eventType,
			},
		});

		return events.map((event) => {
			return new BaseEvent(
				event.aggregateId,
				event.id,
				event.eventType,
				JSON.parse(event.payload),
			);
		});
	}

	async clearAllEvents(): Promise<void> {
		try {
			const userRepository = AppDataSource.getRepository(EventEntity);
			await userRepository.clear();
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async save(event: BaseEvent<any>) {
		const eventEntity = new EventEntity(
			event.id,
			event.eventType,
			JSON.stringify(event.payload),
			event.aggregateId,
		);

		try {
			await this.repository.save(eventEntity);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
}
