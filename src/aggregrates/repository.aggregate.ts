import { AggregateRoot } from ".";
import { Vertix } from "..";
import type { BaseEvent, BasePayload } from "../events";
import type {
	CreateRepositoryPayload,
	DeleteRepositoryPayload,
	RepositoryEvent,
	UpdateRepositoryPayload,
} from "../events/repository.event";
import type { Snapshot } from "../services/snapshot.service";

export enum RepositoryEventType {
	RepositoryCreatedEvent = "RepositoryCreatedEvent",
	RepositoryUpdatedEvent = "RepositoryUpdatedEvent",
	RepositoryDeletedEvent = "RepositoryDeletedEvent",
}

const eventHandlersKey = Symbol("eventHandlers");

export class RepositoryAggregate extends AggregateRoot {
	id: string;
	name!: string;
	description!: string;
	url!: string;
	createdAt!: Date;
	updatedAt!: Date;
	authorId!: string;
	deleted!: boolean;
	deletedAt!: Date | null;
	version = 0;
	latestEventId!: string;
	hasSnapshot = false;
	private = false;

	// Relations
	issues: string[] = [];
	pullRequests: string[] = [];
	releases: string[] = [];
	tags: string[] = [];
	branches: string[] = [];
	contributors: string[] = [];
	watchers: string[] = [];
	license: string | null = null;
	topics: string[] = [];
	forks: string[] = [];
	stargazers: string[] = [];
	licenseId!: string;

	constructor(id: string) {
		super(id);
		this.id = id;
	}

	async applyEvent(
		event: BaseEvent<BasePayload, RepositoryEventType>,
		replay = false,
	) {
		const handler =
			this[eventHandlersKey][event.eventType as RepositoryEventType];

		if (handler) {
			handler(event as RepositoryEvent<any>);
		} else {
			console.warn(`No handler defined for event type ${event.eventType}`);
		}

		if (!replay) {
			this.version++;
			this.latestEventId = event.id;
			await this.createSnapshotIfNeeded();
		}
	}

	async applySnapshot(events: BaseEvent<BasePayload, RepositoryEventType>[]) {
		try {
			const snapshotService = Vertix.getInstance().getSnapshotService();
			const snapshot = await snapshotService.getSnapshot(this.id);

			if (snapshot) {
				this.fromSnapshot(snapshot);
			}

			// Apply the rest of the events if needed
			for (const event of events.filter(
				(e) => e.createdAt.toISOString() === snapshot?.eventTimestamp,
			)) {
				this.applyEvent(event, true);
			}
		} catch (error) {
			$logger.warn(`Could not get snapshot for repository ${this.id}`);
			$logger.error(error);
		}
	}

	private fromSnapshot(snapshot: Snapshot<this>) {
		this.id = snapshot.id;
		this.version = snapshot.version;
		this.latestEventId = snapshot.eventId;

		const data = JSON.parse(snapshot.payload.data);

		for (const [key, value] of Object.entries(data)) {
			(this as any)[key] = value;
		}
	}

	private applyRepositoryCreatedEvent(
		event: BaseEvent<
			CreateRepositoryPayload,
			RepositoryEventType.RepositoryCreatedEvent
		>,
	) {
		for (const [key, value] of Object.entries(event.payload)) {
			(this as any)[key] = value;
		}
	}

	private applyRepositoryUpdatedEvent(
		event: BaseEvent<
			UpdateRepositoryPayload,
			RepositoryEventType.RepositoryUpdatedEvent
		>,
	) {
		for (const [key, value] of Object.entries(event.payload)) {
			(this as any)[key] = value;
		}
	}

	private applyRepositoryDeletedEvent(
		event: BaseEvent<
			DeleteRepositoryPayload,
			RepositoryEventType.RepositoryDeletedEvent
		>,
	) {
		this.deleted = true;
		this.deletedAt = new Date();
	}

	private [eventHandlersKey] = {
		[RepositoryEventType.RepositoryCreatedEvent]: (
			event: RepositoryEvent<CreateRepositoryPayload>,
		) => this.applyRepositoryCreatedEvent(event),
		[RepositoryEventType.RepositoryUpdatedEvent]: (
			event: RepositoryEvent<UpdateRepositoryPayload>,
		) => this.applyRepositoryUpdatedEvent(event),
		[RepositoryEventType.RepositoryDeletedEvent]: (
			event: RepositoryEvent<DeleteRepositoryPayload>,
		) => this.applyRepositoryDeletedEvent(event),
	};

	private async createSnapshotIfNeeded() {
		// Create a snapshot every 5 events
		if (this.version % 5 !== 0) {
			return;
		}

		$logger.info(`Creating snapshot for repository ${this.id}`);
		const snapshotService = Vertix.getInstance().getSnapshotService();
		const snapshot: Snapshot<this> = {
			id: this.id,
			version: this.version,
			eventId: this.latestEventId,
			eventTimestamp: new Date().toISOString(),
			payload: {
				data: JSON.stringify(this.toPrivateObject()),
			},
		};

		await snapshotService.saveSnapshot(snapshot);
		this.hasSnapshot = true;
		$logger.info(`Snapshot for repository ${this.id} sucessfully created`);
	}

	toPublicObject() {
		if (this.private) {
			return null;
		}

		const {
			version,
			deleted,
			deletedAt,
			hasSnapshot,
			latestEventId,
			...repositoryPublic
		} = this;

		return repositoryPublic;
	}

	toPrivateObject() {
		const {
			version,
			deleted,
			deletedAt,
			hasSnapshot,
			latestEventId,
			...repositoryPrivate
		} = this;

		return repositoryPrivate;
	}

	get isDeleted() {
		return this.deleted;
	}
}
