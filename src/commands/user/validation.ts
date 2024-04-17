import { UserEventType } from "../../aggregrates/user.aggregate";
import { AlreadyExistsError } from "../../errors/already-exists.error";
import { DoesNotExistError } from "../../errors/does-not-exist.error";
import type { EventStore } from "../../events/store.event";

export const ensureUpdatedUserDoesNotExist =
	(eventStore: EventStore) => async (email: string, username: string) => {
		// Check if the updated username or email already exists
		const userEvents = await eventStore.loadEventsForAggregate({
			payload: {
				_or: [
					{
						email,
					},
					{
						username,
					},
				],
			},
		});

		if (userEvents.length) {
			throw new AlreadyExistsError(
				"User with this username or email already exists.",
			);
		}
	};

export const ensureUserExists =
	(eventStore: EventStore) => async (userId: string) => {
		// Check if the user exists
		const userEvents = await eventStore.loadEventsForAggregate({
			aggregateId: userId,
		});

		// Check if the user is deleted
		for (const event of userEvents) {
			if (event.eventType === UserEventType.UserDeletedEvent) {
				throw new DoesNotExistError("User does not exist.");
			}
		}

		if (!userEvents.length) {
			throw new DoesNotExistError("User does not exist.");
		}
	};
