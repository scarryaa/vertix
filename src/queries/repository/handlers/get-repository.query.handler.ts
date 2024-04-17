import { Vertix } from "../../..";
import { RepositoryAggregate } from "../../../aggregrates/repository.aggregate";
import type { EventStore } from "../../../events/store.event";
import type { Snapshot } from "../../../services/snapshot.service";
import type { GetRepositoryQuery } from "../get-repository.query";

export class GetRepositoryQueryHandler {
	private eventStore: EventStore;

	constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	// Get a single repository
	async handle(query: GetRepositoryQuery) {
		const repositoryAggregate = new RepositoryAggregate(query.id);
		const events = await this.eventStore.loadEventsForAggregate({
			aggregateId: query.id,
		});

		// Return early if there are no events
		if (events.length === 0) {
			return null;
		}

		const snapshot: Snapshot<RepositoryAggregate> | null =
			await Vertix.getInstance().getSnapshotService().getSnapshot(query.id);
		if (snapshot) {
			repositoryAggregate.applySnapshot(events);

			// Only apply events that occured after the snapshot
			const eventsAfterSnapshot = events.filter(
				(event) => event.createdAt > new Date(snapshot.eventTimestamp),
			);
			for (const event of eventsAfterSnapshot) {
				repositoryAggregate.applyEvent(event, true);
			}
		} else {
			// Apply all events
			for (const event of events) {
				repositoryAggregate.applyEvent(event, true);
			}
		}

		if (repositoryAggregate.isDeleted) {
			return null;
		}

		return repositoryAggregate.toPublicObject();
	}
}
