import { UserAggregate } from "../../../aggregrates/user.aggregate";
import type { EventStore } from "../../../events/store.event";
import {
	type Snapshot,
	SnapshotService,
} from "../../../services/snapshot.service";
import type { GetUserQuery } from "../get-user.query";

export class GetUserQueryHandler {
	private eventStore: EventStore;
	private snapshotService: SnapshotService;

	constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
		this.snapshotService = SnapshotService.getInstance();
	}

	// Get a single user
	async handle(query: GetUserQuery) {
		const userAggregate = new UserAggregate(query.userId);
		const events = await this.eventStore.loadEventsForAggregate({
			aggregateId: query.userId,
		});

		// Early return if there are no events
		if (events.length === 0) {
			return null;
		}

		const snapshot: Snapshot<UserAggregate> | null =
			await this.snapshotService.getSnapshot(query.userId);

		if (snapshot) {
			userAggregate.applySnapshot(events);

			// Apply only events that occurred after the snapshot
			const eventsAfterSnapshot = events.filter(
				(event) => event.createdAt > new Date(snapshot.eventTimestamp),
			);
			for (const event of eventsAfterSnapshot) {
				userAggregate.applyEvent(event, true);
			}
		} else {
			// Apply all events if no snapshot is found
			for (const event of events) {
				userAggregate.applyEvent(event, true);
			}
		}

		if (userAggregate.isDeleted()) {
			return null;
		}

		// Return without password
		return userAggregate.toPublicObject();
	}
}
