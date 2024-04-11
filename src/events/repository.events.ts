import type { RepositoryDetailed, RepositoryUpdateInput, TVisibility } from "../models";
import type {
	CustomErrorEvent,
	GenericErrorEventPayload,
} from "./generic.events";

type RepositoryEventPayload =
	| RepositoryCreatedEventPayload
	| RepositoryUpdatedEventPayload
	| RepositoryDeletedEventPayload
	| RepositoryDeleteFailedEventPayload
	| RepositoryUpdateFailedEventPayload
	| RepositoryCreateFailedEventPayload
	| GenericErrorEventPayload<unknown>;

export interface RepositoryCreatedEventPayload {
	repositoryId: string;
	name: string;
	ownerId: string;
	ownerName: string;
	visibility: TVisibility;
	description: string | null;
}

export interface RepositoryUpdatedEventPayload {
	repositoryId: string;
	changes: RepositoryUpdateInput;
	oldRepository: RepositoryDetailed;
}

export interface RepositoryDeletedEventPayload {
	repositoryId: string;
	repositoryName: string;
}

export interface RepositoryCreateFailedEventPayload {
	repositoryId: string | undefined;
	name: string;
	ownerId: string;
}

export interface RepositoryUpdateFailedEventPayload {
	repositoryId: string;
	changes: RepositoryUpdateInput;
}

export interface RepositoryDeleteFailedEventPayload {
	repositoryId: string;
}

export class RepositoryEvent<PayloadType> {
	id: string;
	type: string;
	timestamp: Date;
	payload: PayloadType;
	userId?: string;
	username?: string;

	constructor(
		id: string,
		type: string,
		timestamp: Date,
		payload: PayloadType,
		userId?: string,
		username?: string,
	) {
		this.id = id;
		this.type = type;
		this.timestamp = timestamp;
		this.payload = payload;
		this.userId = userId;
		this.username = username;
	}
}

export class RepositoryCreatedEvent extends RepositoryEvent<RepositoryCreatedEventPayload> {
	constructor(
		id: string,
		timestamp: Date,
		payload: RepositoryCreatedEventPayload,
		userId?: string,
	) {
		super(id, "RepositoryCreated", timestamp, payload, userId);
	}
}

export class RepositoryUpdatedEvent extends RepositoryEvent<RepositoryUpdatedEventPayload> {
	constructor(
		id: string,
		timestamp: Date,
		payload: RepositoryUpdatedEventPayload,
		userId?: string,
		username?: string,
	) {
		super(id, "RepositoryUpdated", timestamp, payload, userId);
	}
}

export class RepositoryDeletedEvent extends RepositoryEvent<RepositoryDeletedEventPayload> {
	constructor(
		id: string,
		timestamp: Date,
		payload: RepositoryDeletedEventPayload,
		userId?: string,
	) {
		super(id, "RepositoryDeleted", timestamp, payload, userId);
	}
}

// Error events

export class BaseRepositoryErrorEvent extends RepositoryEvent<
	GenericErrorEventPayload<unknown>
> {
	constructor(
		id: string,
		timestamp: Date,
		payload: GenericErrorEventPayload<unknown>,
		userId?: string,
	) {
		super(id, "RepositoryError", timestamp, payload, userId);
	}
}

abstract class CustomRepositoryErrorEvent
	extends BaseRepositoryErrorEvent
	implements CustomErrorEvent
{
	errorDetails?: string | undefined;
	name: string;
	message: string;
	stack?: string | undefined;
	cause?: unknown;

	constructor(
		id: string,
		timestamp: Date,
		payload: GenericErrorEventPayload<unknown>,
		name: string,
		message: string,
		type: string,
		userId?: string,
	) {
		super(id, timestamp, payload, userId);
		this.name = name;
		this.message = message;
		this.type = type;
	}
}

export class RepositoryCreateFailedEvent extends CustomRepositoryErrorEvent {
	constructor(
		id: string,
		timestamp: Date,
		payload: GenericErrorEventPayload<unknown>,
		name: string,
		message: string,
		userId?: string,
	) {
		super(
			id,
			timestamp,
			payload,
			name,
			message,
			"RepositoryCreateFailed",
			userId,
		);
	}
}

export class RepositoryUpdateFailedEvent extends CustomRepositoryErrorEvent {
	constructor(
		id: string,
		timestamp: Date,
		payload: GenericErrorEventPayload<unknown>,
		name: string,
		message: string,
		userId?: string,
	) {
		super(
			id,
			timestamp,
			payload,
			name,
			message,
			"RepositoryUpdateFailed",
			userId,
		);
	}
}

export class RepositoryDeleteFailedEvent extends CustomRepositoryErrorEvent {
	constructor(
		id: string,
		timestamp: Date,
		payload: GenericErrorEventPayload<unknown>,
		name: string,
		message: string,
		userId?: string,
	) {
		super(
			id,
			timestamp,
			payload,
			name,
			message,
			"RepositoryDeleteFailed",
			userId,
		);
	}
}
