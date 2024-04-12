import { randomUUID } from "node:crypto";
import { RepositoryDeletedEvent } from "../../events/repository.events";
import { RepositoryNotFoundError } from "../../utils/errors";
import type { DeleteRepositoryCommand } from "./commands";
import type { RepositoryCommandService } from "./repository-command.service";
import type { Repository } from "./types";

export class DeleteRepositoryCommandHandler {
	constructor(private commandService: RepositoryCommandService) {}

	async handle(command: DeleteRepositoryCommand): Promise<void> {
		let repository: Partial<Repository> | undefined;

		try {
			const { repositoryId, ownerId, authToken } = command;
			const userId = await this.commandService.authenticateAndAuthorize(
				authToken,
				repositoryId,
				"delete",
			);

			await this.commandService.performRepositoryChecks(
				"delete",
				{ id: repositoryId, ownerId: ownerId },
				{ id: userId },
			);

			repository =
				await this.commandService.repositoryBasicRepository.findFirst({
					where: { id: repositoryId },
				});

			if (!repository) {
				throw new RepositoryNotFoundError(repositoryId);
			}

			// Emitting the RepositoryDeletedEvent
			const event = new RepositoryDeletedEvent(
				randomUUID(),
				new Date(),
				{
					repositoryId: repositoryId,
					repositoryName: repository?.name ?? "unknown-name",
					id: randomUUID(),
				},
				userId,
			);

			await this.commandService.eventStore.queueEventForProcessing(event);
			this.commandService.domainEventEmitter.emit("RepositoryDeleted", event);
		} catch (error) {
			console.error(error);
			this.commandService.handleCommandError(command, repository, undefined);
		}
	}
}
