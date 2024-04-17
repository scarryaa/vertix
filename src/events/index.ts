export type BasePayload = {};

export class BaseEvent<U extends BasePayload, EventType> {
	id: string;
	aggregateId: string;
	eventType: EventType;
	payload: U;
	createdAt: Date;

	constructor(
		aggregateId: string,
		id: string,
		eventType: EventType,
		payload: U,
	) {
		this.id = id;
		this.eventType = eventType;
		this.payload = payload;
		this.aggregateId = aggregateId;
		this.createdAt = new Date();
	}
}
