export interface IGenericEvent<PayloadType> {
	id: string;
	type: string;
	timestamp: Date;
	payload: PayloadType;
}

export interface GenericEventPayload<PayloadType> {
	message: string;
	data: PayloadType;
}

export interface GenericErrorEventPayload<Data> {
	message: string;
	errorCode: string;
	data: Data;
}

export class GenericEvent<PayloadType> {
	type: string;

	constructor(
		public readonly id: string,
		public readonly timestamp: Date,
		public readonly payload: PayloadType,
		public readonly reason: string,
	) {
		this.type = "GenericEvent";
	}
}

export interface CustomErrorEvent extends Error {
    errorDetails?: string;
}

export class GenericErrorEvent<Data> extends GenericEvent<
	GenericErrorEventPayload<Data>
> {
	constructor(
		id: string,
		timestamp: Date,
		payload: GenericErrorEventPayload<Data>,
		reason: string,
		userId?: string,
	) {
		super(id, timestamp, payload, reason);
		this.type = "GenericError";
	}

	toString(): string {
		// @TODO check for sensitive data?
		return `GenericError: ${this.payload.message}, Code: ${
			this.payload.errorCode
		}, Data: ${JSON.stringify(this.payload.data)}`;
	}
}
