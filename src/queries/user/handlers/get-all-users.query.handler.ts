import {
	UserAggregate,
	UserEventType,
} from "../../../aggregrates/user.aggregate";
import type { BaseEvent } from "../../../events";
import type { EventStore } from "../../../events/store.event";

export class GetAllUsersQueryHandler {
	private eventStore: EventStore;

	constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	async handle() {
		// Load UserCreated, UserDeleted, and UserUpdated events in parallel
		const [userCreatedEvents, userDeletedEvents, userUpdatedEvents] =
			await Promise.all([
				this.eventStore.loadAllEventsOfType(UserEventType.UserCreatedEvent),
				this.eventStore.loadAllEventsOfType(UserEventType.UserDeletedEvent),
				this.eventStore.loadAllEventsOfType(UserEventType.UserUpdatedEvent),
			]);

		// Combine and sort all events by timestamp
		const allEvents = [
			...userCreatedEvents,
			...userDeletedEvents,
			...userUpdatedEvents,
		];
		allEvents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

		// Process events to reconstruct user states
		const userAggregates = {} as Record<string, UserAggregate>;
		for (const event of allEvents) {
			const aggregateId = event.aggregateId;
			if (!userAggregates[aggregateId]) {
				userAggregates[aggregateId] = new UserAggregate(aggregateId);
			}
			const userAggregate = userAggregates[aggregateId];

			// Apply event if not a deletion
			if (event.eventType !== UserEventType.UserDeletedEvent) {
				userAggregate?.applyEvent(event, true);
			}
		}

		// Filter out deleted users and convert to public object format
		const users = Object.values(userAggregates)
			.filter((user) => !user.isDeleted())
			.map((user) => user.toPublicObject());

		// Return the final list of users and the count
		return {
			users,
			count: users.length,
		};
	}

	replayEvent(event: BaseEvent<any, any>): any {
		const user = new UserAggregate(event.aggregateId);
		user.applyEvent(event, true);
		return user;
	}
}
