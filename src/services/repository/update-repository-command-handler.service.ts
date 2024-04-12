import { randomUUID } from "node:crypto";
import { RepositoryUpdatedEvent } from "../../events/repository.events";
import { Session } from "../../session/index.session";
import {
	RepositoryNotFoundError,
	RepositoryUpdateError,
} from "../../utils/errors";
import type { UpdateRepositoryCommand } from "./commands";
import type { RepositoryCommandService } from "./repository-command.service";
import type { Repository } from "./types";

export class UpdateRepositoryCommandHandler {
	constructor(private commandService: RepositoryCommandService) {}

	async handle(command: UpdateRepositoryCommand): Promise<void> {
		const { authToken, repositoryData, repositoryId } = command;

		try {
			const { authToken, repositoryData, repositoryId } = command;
			// Auuthenticate and authorize the user
			const userId = await this.commandService.authenticateAndAuthorize(
				authToken,
				repositoryId,
			);

			await this.commandService.performRepositoryChecks(
				"update",
				{ ...repositoryData, id: repositoryId },
				{ id: userId },
			);

			if (!repositoryData || Object.keys(repositoryData).length === 0) {
				throw new RepositoryUpdateError(
					`Repository data is invalid: ${JSON.stringify(repositoryData)}`,
				);
			}

			// Fetch the existing repository to compare changes
			const oldRepository =
				await this.commandService.repositoryDetailedRepository.findFirst({
					where: { id: repositoryId },
				});

			if (!oldRepository) {
				throw new RepositoryNotFoundError(repositoryId);
			}

			// Determine changes for the event
			const changes = Object.keys(repositoryData).reduce(
				(acc, key) => {
					const typedKey = key as keyof Repository;
					const newValue = repositoryData[typedKey];
					const oldValue = oldRepository[typedKey];

					// Handling Date objects specifically
					if (newValue instanceof Date && oldValue instanceof Date) {
						if (newValue.getTime() !== oldValue.getTime()) {
							acc[typedKey] = newValue !== null ? newValue : (undefined as any);
						}
					} else if (newValue !== oldValue) {
						acc[typedKey] = newValue !== null ? newValue : (undefined as any);
					}
					return acc;
				},
				{} as Partial<Repository>,
			);

			if (Object.keys(changes).length === 0) {
				throw new RepositoryUpdateError("No changes detected.");
			}

			// Create and emit the event
			const event = new RepositoryUpdatedEvent(
				randomUUID(),
				new Date(),
				{
					...repositoryData,
					changes,
					oldRepository,
					repositoryId: repositoryId,
					id: randomUUID(),
					repositoryName: repositoryData.name ?? "",
				},
				userId,
				Session.getInstance().getUser()?.username,
			);
			await this.commandService.eventStore.queueEventForProcessing(event);
			this.commandService.domainEventEmitter.emit("RepositoryUpdated", event);
		} catch (error) {
			this.commandService.handleCommandError(error, repositoryData, authToken);
		}
	}
}
