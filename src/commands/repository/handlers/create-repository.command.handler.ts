import { RepositoryAggregate } from "../../../aggregrates/repository.aggregate";
import { RepositoryEventFactory } from "../../../events/repository-factory.event";
import type { EventStore } from "../../../events/store.event";
import { BaseCommandHandler } from "../../handlers";
import { ensureRepositoryDoesNotExist } from "../validation";
import type { CreateRepositoryCommand } from "./create-repository.command";

export class CreateRepositoryCommandHandler extends BaseCommandHandler {
	protected eventStore: EventStore;

	constructor(eventStore: EventStore) {
		super(eventStore);
		this.eventStore = eventStore;
	}

	async handle(command: CreateRepositoryCommand): Promise<void> {
		// Check if repository already exists
		await ensureRepositoryDoesNotExist(this.eventStore)(command);

		const repository = new RepositoryAggregate(command.id);
		const event = RepositoryEventFactory.createRepositoryEvent({
			authorId: command.authorId,
			id: command.id,
			name: command.name,
			description: command.description,
			private: command.private,
		});

		await this.eventStore.save(event);
		await repository.apply(event);
		$logger.info(`Repository ${command.name} created.`);
	}
}
