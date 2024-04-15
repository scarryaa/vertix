import type { BaseCommand } from "..";
import type { EventStore } from "../../events/store.event";

export abstract class BaseCommandHandler {
	protected eventStore: EventStore;

	constructor(eventStore: EventStore) {
		this.eventStore = eventStore;
	}

	abstract handle(command: BaseCommand<any>): Promise<void>;
}
