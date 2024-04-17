import {
	RepositoryAggregate,
	RepositoryEventType,
} from "../../../aggregrates/repository.aggregate";
import type { EventStore } from "../../../events/store.event";

export class GetAllRepositoriesQueryHandler {
	private eventStore: EventStore;

	constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	async handle() {
		// Load all repository events
		const [
			repositoryCreatedEvents,
			repositoryDeletedEvents,
			repositoryUpdatedEvents,
		] = await Promise.all([
			this.eventStore.loadAllEventsOfType(
				RepositoryEventType.RepositoryCreatedEvent,
			),
			this.eventStore.loadAllEventsOfType(
				RepositoryEventType.RepositoryDeletedEvent,
			),
			this.eventStore.loadAllEventsOfType(
				RepositoryEventType.RepositoryUpdatedEvent,
			),
		]);

		const allEvents = [
			...repositoryCreatedEvents,
			...repositoryDeletedEvents,
			...repositoryUpdatedEvents,
		];
		allEvents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

		// Process events to reconstruct repositories
		const repositories = {} as Record<string, RepositoryAggregate>;
		for (const event of allEvents) {
			const aggregateId = event.aggregateId;

			if (!repositories[aggregateId]) {
				repositories[aggregateId] = new RepositoryAggregate(aggregateId);
			}
			const repository = repositories[aggregateId];

			// Apply event to repository if not a deletion
			if (event.eventType !== RepositoryEventType.RepositoryDeletedEvent) {
				repository?.applyEvent(event, true);
			}
		}

		// Filter out deleted repositories
		const filteredRepositories = Object.values(repositories)
			.filter((repository) => !repository.deleted)
			.map((repository) => repository.toPublicObject());

		return {
			filteredRepositories,
			count: filteredRepositories.length,
		};
	}
}
