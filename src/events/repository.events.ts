import type {
	RepositoryDetailed,
	RepositoryUpdateInput,
	TVisibility,
} from "../models";
import type { BaseEntity } from "../models/base.model";
import type { DomainEvent } from "./domain.event";
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

export interface RepositoryCreatedEventPayload extends BaseEntity {
	repositoryId: string;
	repositoryName: string;
	ownerId: string;
	ownerName: string;
	visibility: TVisibility;
	description: string | null;
}

export interface RepositoryUpdatedEventPayload extends BaseEntity {
	repositoryId: string;
	repositoryName: string;
	changes: RepositoryUpdateInput;
	oldRepository: RepositoryDetailed;
}

export interface RepositoryDeletedEventPayload extends BaseEntity {
	repositoryId: string;
	repositoryName: string;
}

export interface RepositoryCreateFailedEventPayload extends BaseEntity {
	repositoryId: string | undefined;
	name: string;
	ownerId: string;
}

export interface RepositoryUpdateFailedEventPayload extends BaseEntity {
	repositoryId: string;
	changes: RepositoryUpdateInput;
}

export interface RepositoryDeleteFailedEventPayload extends BaseEntity {
	repositoryId: string;
}

export class RepositoryEvent<PayloadType> implements DomainEvent {
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

export class RepositoryCreatedEvent
	extends RepositoryEvent<RepositoryCreatedEventPayload>
	implements BaseEntity
{
	constructor(
		id: string,
		timestamp: Date,
		payload: RepositoryCreatedEventPayload,
		userId?: string,
	) {
		super(id, "RepositoryCreated", timestamp, payload, userId);
	}
}

export class RepositoryUpdatedEvent
	extends RepositoryEvent<RepositoryUpdatedEventPayload>
	implements BaseEntity
{
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

export class RepositoryDeletedEvent
	extends RepositoryEvent<RepositoryDeletedEventPayload>
	implements BaseEntity
{
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
