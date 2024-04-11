import type { DomainEventEmitter } from "../../events/event-emitter.events";
import type { EventStore } from "../../events/event-store.events";
import type {
	RepositoryCreatedEvent,
	RepositoryUpdatedEvent,
} from "../../events/repository.events";
import type { RepositoryDashboardReadModel } from "../../models/read-models/repository.read-model";
import type { ReadModelStore } from "./read-model.store";

export class ReadModelProjector {
	constructor(
		private eventStore: EventStore,
		private eventEmitter: DomainEventEmitter,
		private readModelStore: ReadModelStore<Record<number, RepositoryDashboardReadModel | undefined>>,
	) {}

	start() {
		this.eventEmitter.on(
			"RepositoryCreated",
			this.onRepositoryCreated.bind(this),
		);
		this.eventEmitter.on(
			"RepositoryUpdated",
			this.onRepositoryUpdated.bind(this),
		);
	}

	private async onRepositoryCreated(event: RepositoryCreatedEvent) {
		const dashboardReadModel: RepositoryDashboardReadModel = {
			id: event.payload.repositoryId,
			owner: {
				connect: {
					id: event.payload.ownerId,
				}
			},
			name: event.payload.name,
			starCount: 0,
			ownerId: event.payload.ownerId,
			description: event.payload.description,
			primaryLanguage: null,
			visibility: event.payload.visibility,
		};
		// await this.readModelStore.handleEvent(event);
		// this.eventStore.queueEventForProcessing(event);
	}

	private async onRepositoryUpdated(event: RepositoryUpdatedEvent) {
		const updates = {
			name: event.payload.changes.name,
			description: event.payload.changes.description,
		};
		// await this.readModelStore.handleEvent(event);
		// this.eventStore.queueEventForProcessing(event);
	}
}
