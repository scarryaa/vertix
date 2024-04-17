import { Vertix } from "..";
import { UserAggregate } from "../aggregrates/user.aggregate";
import type { EventStore } from "../events/store.event";
import type { Snapshot } from "./snapshot.service";

export class UserService {
	private eventStore: EventStore;
	private static instance: UserService;

	private constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	public async reconstructUserAggregateFromEvents(
		userId: string,
	): Promise<UserAggregate> {
		// Check if user has a snapshot
		const snapshot: Snapshot<UserAggregate> | null = await Vertix.getInstance()
			.getSnapshotService()
			.getSnapshot(userId);

		// If snapshot is found, load it and add any additional events
		if (snapshot) {
			// Compare latest event timestamp
			const latestEventTimestamp = new Date(snapshot.eventTimestamp);
			const events = await this.eventStore.loadEventsForAggregate({
				aggregateId: userId,
			});

			// Reconstruct the user
			const userAggregate = new UserAggregate(userId);
			for (const event of events.filter(
				(e) => e.createdAt > latestEventTimestamp,
			)) {
				userAggregate.applyEvent(event, true);
			}

			return userAggregate;
		}

		const events = await this.eventStore.loadEventsForAggregate({
			aggregateId: userId,
		});

		const user = new UserAggregate(userId);
		for (const event of events) {
			user.applyEvent(event, true);
		}

		return user;
	}

	public static initialize(eventStore: EventStore): void {
		UserService.instance = new UserService(eventStore);
	}

	public static getInstance(): UserService {
		return UserService.instance;
	}
}
