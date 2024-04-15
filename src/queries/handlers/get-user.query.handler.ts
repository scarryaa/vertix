import { UserAggregate } from "../../aggregrates/user.aggregrate";
import type { EventStore } from "../../events/store.event";
import type {
	CreateUserPayload,
	DeleteUserPayload,
	UserEvent,
} from "../../events/user.event";
import { GetUserQuery } from "../get-user.query";

export class GetUserQueryHandler {
	private eventStore: EventStore;

	constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	// Get a single user
	async handle(query: GetUserQuery) {
		// Fetch all events for the user
		const command = new GetUserQuery(query.userId);
		const events = await this.eventStore.loadEventsForAggregate({
			aggregateId: query.userId,
		});
		$logger.info(JSON.stringify(events));

		// Reconstruct the user
		const userAggregate = new UserAggregate(query.userId);
		for (const event of events) {
			$logger.debug(`Applying event ${event.eventType}`);
			// Example type check and casting
			if (event.eventType === "UserCreated") {
				userAggregate.applyEvent(event as UserEvent<CreateUserPayload>);
			} else if (event.eventType === "UserDeleted") {
				userAggregate.applyEvent(event as UserEvent<DeleteUserPayload>);
			}
		}

		if (userAggregate.isDeleted()) {
			return null;
		}

		return userAggregate;
	}
}
