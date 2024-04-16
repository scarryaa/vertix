import { UserAggregate } from "../aggregrates/user.aggregrate";
import type { EventStore } from "../events/store.event";

export class UserService {
	private eventStore: EventStore;
	private static instance: UserService;

	private constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	public async reconstructUserAggregateFromEvents(
		userId: string,
	): Promise<UserAggregate> {
		const events = await this.eventStore.loadEventsForAggregate({
			aggregateId: userId,
		});

		const user = new UserAggregate(userId);
		for (const event of events) {
			user.applyEvent(event);
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
