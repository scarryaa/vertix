import { Brackets } from "typeorm";
import { BaseEvent, type BasePayload } from ".";
import type { UserEventType } from "../aggregrates/user.aggregate";
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

	async queryIndex<T>(options: {
		aggregateId?: string;
		payloadMatches?: any;
		payloadContains?: any;
		eventType?: string;
		limit?: number;
		offset?: number;
	}): Promise<EventEntity<T>[]> {
		const queryBuilder = this.getRepository().createQueryBuilder("event");

		for (const [key, value] of Object.entries(options)) {
			// skip payload, limit, offset
			if (
				key === "payloadContains" ||
				key === "payloadMatches" ||
				key === "limit" ||
				key === "offset"
			) {
				continue;
			}

			queryBuilder.andWhere(`event.${key} = :${key}`, {
				[key]: value,
			});
		}

		if (options.payloadMatches) {
			for (const [key, value] of Object.entries(options.payloadMatches)) {
				queryBuilder.andWhere(`event.payload->>'${key}' = :${key}`, {
					[key]: value,
				});
			}
		}

		if (options.payloadContains) {
			queryBuilder.andWhere(
				new Brackets((qb) => {
					for (const [key, value] of Object.entries(options.payloadContains)) {
						qb.orWhere(`event.payload->>'${key}' LIKE :${key}`, {
							[key]: `%${value}%`,
						});
					}
				}),
			);
		}

		if (options.limit) {
			queryBuilder.limit(options.limit);
		}

		if (options.offset) {
			queryBuilder.offset(options.offset);
		}

		return await queryBuilder.getMany();
	}

	async loadEventsForAggregate<T extends Partial<BasePayload>>(options: {
		aggregateId?: string;
		payload?: T & { _or?: any };
	}): Promise<BaseEvent<T, any>[]> {
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
		if (events.length === 0) {
			return [];
		}

		return events.map(
			(event) =>
				new BaseEvent<T, UserEventType>(
					event.aggregateId,
					event.id,
					event.eventType as UserEventType,
					event.payload,
				),
		);
	}

	async loadAllEventsOfType<T extends BasePayload>(
		eventType: string,
	): Promise<BaseEvent<T, any>[]> {
		const events = await this.getRepository().find({
			where: {
				eventType,
			},
		});

		return events.map((event) => {
			return new BaseEvent<T, UserEventType>(
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

	async save(event: BaseEvent<any, UserEventType>) {
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
