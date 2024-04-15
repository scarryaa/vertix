export type BasePayload = {};

export class BaseEvent<U extends BasePayload> {
	id: string;
	aggregateId: string;
	eventType: string;
	payload: U;
	createdAt: Date;

	constructor(aggregateId: string, id: string, eventType: string, payload: U) {
		this.id = id;
		this.eventType = eventType;
		this.payload = payload;
		this.aggregateId = aggregateId;
		this.createdAt = new Date();
	}
}
