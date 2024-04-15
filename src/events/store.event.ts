import { Brackets } from "typeorm";
import { BaseEvent, type BasePayload } from ".";
import type { UserEventType } from "../aggregrates/user.aggregrate";
import { AppDataSource } from "../data-source";
import { EventEntity } from "../entities/Event";
import { Logger } from "../logger";

export class EventStore {
	private static instance: EventStore;

	private constructor() {}

	// Need this because we can't set the repository in the constructor
	getRepository() {
		return AppDataSource.getInstance().getRepository(EventEntity);
	}

	static getInstance(): EventStore {
		if (!EventStore.instance) {
			EventStore.instance = new EventStore();
		}
		return EventStore.instance;
	}

	async logAllEvents(): Promise<void> {
		const events = await this.getRepository().find();
		for (const event of events) {
			Logger.getInstance().info(JSON.stringify(event));
		}
	}

	async loadEventsForAggregate<T extends Partial<BasePayload>>(options: {
		aggregateId?: string;
		payload?: T & { _or?: any };
	}): Promise<BaseEvent<T>[]> {
		const queryBuilder = this.getRepository().createQueryBuilder("event");

		if (options.aggregateId) {
			queryBuilder.where("event.aggregateId = :aggregateId", {
				aggregateId: options.aggregateId,
			});
		}

		if (options.payload) {
			if ("_or" in options.payload) {
				const orConditions = options.payload._or as BasePayload[];
				queryBuilder.andWhere(
					new Brackets((qb) => {
						orConditions.forEach((condition: any, index: number) => {
							const conditionKey = Object.keys(condition)[0];
							qb.orWhere(
								`event.payload->>'${conditionKey}' = :conditionValue${index}`,
								{
									[`conditionValue${index}`]: condition[conditionKey!],
								},
							);
						});
					}),
				);
			} else {
				// Existing logic for direct matching
				for (const [key, value] of Object.entries(options.payload)) {
					queryBuilder.andWhere(`event.payload->>'${key}' = :${key}`, {
						[key]: (options.payload as any)[key],
					});
				}
			}
		}

		const events = await queryBuilder.getMany();
		return events.map(
			(event) =>
				new BaseEvent<T>(
					event.aggregateId,
					event.id,
					event.eventType as UserEventType,
					event.payload,
				),
		);
	}

	async loadAllEventsOfType<T extends BasePayload>(
		eventType: string,
	): Promise<BaseEvent<T>[]> {
		const events = await this.getRepository().find({
			where: {
				eventType,
			},
		});

		return events.map((event) => {
			return new BaseEvent<T>(
				event.aggregateId,
				event.id,
				event.eventType as UserEventType,
				event.payload,
			);
		});
	}

	async clearAllEvents(): Promise<void> {
		try {
			const userRepository =
				AppDataSource.getInstance().getRepository(EventEntity);
			await userRepository.clear();
		} catch (error) {
			$logger.error(error);
			throw error;
		}
	}

	async save(event: BaseEvent<any>) {
		const eventEntity = new EventEntity(
			event.id,
			event.eventType,
			event.payload,
			event.aggregateId,
		);

		try {
			await this.getRepository().save(eventEntity);
		} catch (error) {
			$logger.error(error);
			throw error;
		}
	}
}
