import bcrypt from "bcrypt";
import { UserAggregate, UserEventType } from "../aggregrates/user.aggregrate";
import { DoesNotExistError } from "../errors/does-not-exist.error";
import type { EventStore } from "../events/store.event";

export const validateUserCredentials = (eventStore: EventStore) =>
	async function validateUserCredentials(
		username: string,
		password: string,
	): Promise<{ id: string; username: string } | null> {
		const userId = await resolveUsernameToUserId(eventStore)(username);
		const userEvents = await eventStore.loadEventsForAggregate({ aggregateId: userId });

		// Reconstruct the user's state from the events
		const user = new UserAggregate(userId);
        for (const event of userEvents) {
            user.applyEvent(event);
        }

        // Make sure the user is not deleted
        if (user.isDeleted()) {
            throw new DoesNotExistError("User does not exist.");
        }

		// If the user has been reconstructed successfully and the password matches, return the user
		if (user && (await bcrypt.compare(password, user.getPassword()))) {
			return { id: userId, username: username };
		}

		return null;
	};

export const resolveUsernameToUserId = (eventStore: EventStore) =>
	async function resolveUsernameToUserId(username: string): Promise<string> {
		const userEvents = await eventStore.loadEventsForAggregate({
			payload: {
				username,
			},
		});

		// Get the user's id
		const userId = userEvents.find(
			(event) => event.eventType === UserEventType.UserCreatedEvent,
		)?.aggregateId;

		if (!userId) {
			throw new DoesNotExistError("User does not exist.");
		}

		return userId;
	};

