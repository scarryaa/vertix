import { UserAggregate } from "../../aggregrates/user.aggregrate";
import type { BaseEvent } from "../../events";
import type { EventStore } from "../../events/store.event";

export class GetAllUsersQueryHandler {
	private eventStore: EventStore;

	constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	async handle() {
		// Load both UserCreated and UserDeleted events
		const userCreatedEvents =
			await this.eventStore.loadAllEventsOfType("UserCreatedEvent");
		const userDeletedEvents =
			await this.eventStore.loadAllEventsOfType("UserDeletedEvent");
		const allEvents = [...userCreatedEvents, ...userDeletedEvents];

		// Sort events by timestamp or sequence
		allEvents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

		const users = allEvents.reduce((acc: any, event) => {
			if (event.eventType === "UserDeletedEvent") {
				// Mark the user as deleted or remove from the accumulator
				const index = acc.findIndex(
					(user: any) => user.id === event.aggregateId,
				);
				if (index !== -1) {
					acc.splice(index, 1);
				}
			} else if (event.eventType === "UserCreatedEvent") {
				// Handle UserCreatedEvent or other event types
				const user = this.replayEvent(event);
				acc.push(user);
			}
			return acc;
		}, []);

		return { users, count: users.length };
	}

	replayEvent(event: BaseEvent<any>): any {
		const user = new UserAggregate(event.aggregateId);
		user.applyEvent(event);
		return user;
	}
}
