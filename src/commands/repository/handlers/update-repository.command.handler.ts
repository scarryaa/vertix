import { RepositoryAggregate } from "../../../aggregrates/repository.aggregate";
import { RepositoryEventFactory } from "../../../events/repository-factory.event";
import type { EventStore } from "../../../events/store.event";
import { BaseCommandHandler } from "../../handlers";
import type { UpdateRepositoryCommand } from "../update-repository.command";
import {
	ensureRepositoryDoesNotExist,
	throwDoesNotExistError,
} from "../validation";

export class UpdateRepositoryCommandHandler extends BaseCommandHandler {
	protected eventStore: EventStore;

	constructor(eventStore: EventStore) {
		super(eventStore);
		this.eventStore = eventStore;
	}

	async handle(command: UpdateRepositoryCommand): Promise<void> {
		// Check if repository to update exists
		await this.ensureRepositoryExists(command);
		// Check if updated repository name already exists
		await ensureRepositoryDoesNotExist(this.eventStore)(command);

		// Update repository
		const repository = new RepositoryAggregate(command.id);

		for (const [key, value] of Object.entries(command)) {
			(repository as any)[key] = value;
		}

		const event = RepositoryEventFactory.updateRepositoryEvent(repository);
		await this.eventStore.save(event);
		await repository.apply(event);
	}

	private async ensureRepositoryExists(
		command: UpdateRepositoryCommand,
	): Promise<void> {
		const repositoryEvents =
			await this.eventStore.loadEventsForAggregate<RepositoryAggregate>({
				aggregateId: command.id,
			});

		$logger.debug(repositoryEvents);

		if (repositoryEvents.length === 0) {
			throwDoesNotExistError(command.id)();
		}
	}
}
