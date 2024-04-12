import { randomUUID } from "node:crypto";
import { RepositoryCreatedEvent } from "../../events/repository.events";
import type { CreateRepositoryCommand } from "./commands";
import type { RepositoryCommandService } from "./repository-command.service";

export class CreateRepositoryCommandHandler {
	constructor(private commandService: RepositoryCommandService) {}

	async handle(command: CreateRepositoryCommand): Promise<void> {
		const { repositoryData, authToken } = command;

		try {
			const loggedInUserId = await this.commandService.authenticateAndAuthorize(
				authToken,
				undefined,
				"create",
			);
			console.log(loggedInUserId);
			const userInfo =
				await this.commandService.userService.getById(loggedInUserId);

			await this.commandService.performRepositoryChecks(
				"create",
				repositoryData,
				userInfo,
			);

			const repositoryCreatedEvent = new RepositoryCreatedEvent(
				randomUUID(),
				new Date(),
				{
					...repositoryData,
					repositoryId: randomUUID(),
					ownerId: loggedInUserId,
					ownerName: userInfo?.username!,
					repositoryName: repositoryData.name,
					id: repositoryData.id,
				},
			);

			await this.commandService.eventStore.queueEventForProcessing(
				repositoryCreatedEvent,
			);
			this.commandService.domainEventEmitter.emit(
				"RepositoryCreated",
				repositoryCreatedEvent,
			);
		} catch (error) {
			console.error(error);
			this.commandService.handleCommandError(
				command,
				repositoryData,
				undefined,
			);
		}
	}
}
