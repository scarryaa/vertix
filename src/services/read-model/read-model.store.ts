import type { DomainEvent } from "../../events/domain.event";
import type { EventStore } from "../../events/event-store.events";
import type {
	RepositoryCreatedEventPayload,
	RepositoryDeletedEventPayload,
	RepositoryUpdatedEventPayload,
} from "../../events/repository.events";
import type { RepositoryDashboardReadModel } from "../../models/read-models/repository.read-model";
import { ReadModelError, isRepositoryEvent } from "./types";

export class ReadModelStore<
	T extends Record<string, RepositoryDashboardReadModel | undefined>,
> {
	private eventStore: EventStore;
	private readModel: T;

	constructor(eventStore: EventStore, initialState: T) {
		this.eventStore = eventStore;
		this.readModel = initialState;
	}

	public async rebuild(): Promise<void> {
		this.readModel = await this.buildReadModel();
	}

	public async handleEvent(event: DomainEvent): Promise<void> {
		if (isRepositoryEvent(event)) {
			switch (event.type) {
				case "RepositoryCreated":
					await this.applyCreateEvent(
						event.payload as RepositoryCreatedEventPayload,
					);
					break;
				case "RepositoryUpdated":
					await this.applyUpdateEvent(
						event.payload as RepositoryUpdatedEventPayload,
					);
					break;
				case "RepositoryDeleted":
					await this.applyDeleteEvent(
						event.payload as RepositoryDeletedEventPayload,
					);
					break;
				// Handle failed events similarly
				case "RepositoryCreateFailed":
				case "RepositoryUpdateFailed":
				case "RepositoryDeleteFailed":
					break;
				default:
					console.warn("Unhandled repository event type:", event.type);
					break;
			}
		}
	}

	public getReadModel(): T {
		return this.readModel;
	}

	private applyCreateEvent(payload: RepositoryCreatedEventPayload): T {
		const updatedReadModel = {
			...this.readModel,
			[payload.repositoryId]: {
				id: payload.repositoryId,
				name: payload.name,
				ownerId: payload.ownerId,
				ownerName: payload.ownerName,
				visibility: payload.visibility,
				description: payload.description,
			},
		};
		return updatedReadModel as T;
	}

	private applyUpdateEvent(payload: RepositoryUpdatedEventPayload): T {
		const updatedReadModel = {
			...this.readModel,
			[payload.repositoryId]: {
				...this.readModel[payload.repositoryId],
				name: payload.changes.name,
				visibility: payload.changes.visibility,
				description: payload.changes.description,
			},
		};
		return updatedReadModel as T;
	}

	private applyDeleteEvent(payload: RepositoryDeletedEventPayload): T {
		const updatedReadModel = { ...this.readModel };
		delete updatedReadModel[payload.repositoryId];
		return updatedReadModel as T;
	}

	private async buildReadModel(): Promise<T> {
		const events = await this.eventStore.getAllEvents();
		const initialState: T = { ...this.readModel };

		const finalState = events.reduce<T>((state, event) => {
			switch (event.type) {
				case "RepositoryCreated":
					return this.applyCreateEvent(
						event.payload as RepositoryCreatedEventPayload,
					);
				case "RepositoryUpdated":
					return this.applyUpdateEvent(
						event.payload as RepositoryUpdatedEventPayload,
					);
				case "RepositoryDeleted":
					return this.applyDeleteEvent(
						event.payload as RepositoryDeletedEventPayload,
					);
				default:
					return state;
			}
		}, initialState);

		return finalState;
	}
}
