import { UserAggregate } from "../../aggregrates/user.aggregrate";
import type { EventStore } from "../../events/store.event";
import { GetUserQuery } from "../get-user.query";

export class GetUserQueryHandler {
	private eventStore: EventStore;

	constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	// Get a single user
	async handle(userId: string) {
		// Fetch all events for the user
		const command = new GetUserQuery(userId);
		const events = await this.eventStore.loadEventsForAggregate(command.userId);

		// Reconstruct the user
		const userAggregate = new UserAggregate(userId);
		for (const event of events) {
			userAggregate.applyEvent(event);
		}

		if (userAggregate.isDeleted()) {
			return null;
		}

		return userAggregate;
	}
}
