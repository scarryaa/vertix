import type { UserEventType } from "../aggregrates/user.aggregrate";

export type BasePayload = {};

export class BaseEvent<U extends BasePayload> {
	id: string;
	aggregateId: string;
	eventType: UserEventType;
	payload: U;
	createdAt: Date;

	constructor(aggregateId: string, id: string, eventType: UserEventType, payload: U) {
		this.id = id;
		this.eventType = eventType;
		this.payload = payload;
		this.aggregateId = aggregateId;
		this.createdAt = new Date();
	}
}
