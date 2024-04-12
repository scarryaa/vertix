import type { DomainEvent } from "../../events/domain.event";
import type { EventStore } from "../../events/event-store.events";
import type {
	RepositoryCreatedEventPayload,
	RepositoryDeletedEventPayload,
	RepositoryUpdatedEventPayload,
} from "../../events/repository.events";
import type { RepositoryDashboardReadModel } from "../../models/read-models/repository.read-model";
import { isRepositoryEvent } from "./types";

export class ReadModelStore<
	T extends Record<string, RepositoryDashboardReadModel | undefined>,
> {
	private eventStore: EventStore;
	private readModel: T;

	constructor(eventStore: EventStore, initialState: T) {
		this.eventStore = eventStore;
		this.readModel = initialState;
	}

	public handleEvent(event: DomainEvent): Promise<void> {
		if (isRepositoryEvent(event)) {
			switch (event.type) {
				case "RepositoryCreated": {
					this.readModel = this.applyCreateEvent(
						this.readModel,
						event.payload as RepositoryCreatedEventPayload,
					);
					break;
				}
				case "RepositoryUpdated": {
					this.readModel = this.applyUpdateEvent(
						this.readModel,
						event.payload as RepositoryUpdatedEventPayload,
					);
					break;
				}
				case "RepositoryDeleted": {
					this.readModel = this.applyDeleteEvent(
						this.readModel,
						event.payload as RepositoryDeletedEventPayload,
					);
					break;
				}
				case "RepositoryCreateFailed":
				case "RepositoryUpdateFailed":
				case "RepositoryDeleteFailed":
					break;
				default: {
					console.warn("Unhandled repository event type:", event.type);
					break;
				}
			}
		}

		return new Promise(() => {});
	}

	public getReadModel(): T {
		return this.readModel;
	}

	private applyCreateEvent(
		state: T,
		payload: RepositoryCreatedEventPayload,
	): T {
		const updatedState: T = {
			...state,
			[payload.repositoryId]: {
				id: payload.repositoryId,
				name: payload.repositoryName,
				ownerId: payload.ownerId,
				ownerName: payload.ownerName,
				visibility: payload.visibility,
				description: payload.description,
			},
		};
		return updatedState;
	}

	private applyUpdateEvent(
		state: T,
		payload: RepositoryUpdatedEventPayload,
	): T {
		// Ensure the repository exists before updating
		if (!state[payload.repositoryId]) {
			return state;
		}

		const updatedState: T = {
			...state,
			[payload.repositoryId]: {
				...state[payload.repositoryId],
				name: payload.changes.name,
				visibility: payload.changes.visibility,
				description: payload.changes.description,
			},
		};
		return updatedState;
	}

	private applyDeleteEvent(
		state: T,
		payload: RepositoryDeletedEventPayload,
	): T {
		const { [payload.repositoryId]: _, ...rest } = state;
		return rest as T;
	}

	private async buildReadModel(): Promise<T> {
		const events = await this.eventStore.getAllEvents();
		const initialState: T = { ...this.readModel };

		const finalState = events.reduce<T>((state, event) => {
			switch (event.type) {
				case "RepositoryCreated":
					return this.applyCreateEvent(
						state,
						event.payload as RepositoryCreatedEventPayload,
					);
				case "RepositoryUpdated":
					return this.applyUpdateEvent(
						state,
						event.payload as RepositoryUpdatedEventPayload,
					);
				case "RepositoryDeleted":
					return this.applyDeleteEvent(
						state,
						event.payload as RepositoryDeletedEventPayload,
					);
				default:
					return state;
			}
		}, initialState);

		return finalState;
	}
}
