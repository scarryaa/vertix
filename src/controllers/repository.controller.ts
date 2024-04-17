import type { CreateRepositoryCommand } from "../commands/repository/handlers/create-repository.command";
import type { CreateRepositoryCommandHandler } from "../commands/repository/handlers/create-repository.command.handler";
import type { UpdateRepositoryCommandHandler } from "../commands/repository/handlers/update-repository.command.handler";
import type { UpdateRepositoryCommand } from "../commands/repository/update-repository.command";
import type { GetRepositoryQuery } from "../queries/repository/get-repository.query";
import type { GetAllRepositoriesQueryHandler } from "../queries/repository/handlers/get-all-repositories.query.handler";
import type { GetRepositoryQueryHandler } from "../queries/repository/handlers/get-repository.query.handler";

export class RepositoryController {
	private getAllRepositoriesQueryHandler: GetAllRepositoriesQueryHandler;
	private getRepositoryQueryHandler: GetRepositoryQueryHandler;
	private createRepositoryCommandHandler: CreateRepositoryCommandHandler;
	private updateRepositoryCommandHandler: UpdateRepositoryCommandHandler;

	constructor(
		getAllRepositoriesQueryHandler: GetAllRepositoriesQueryHandler,
		getRepositoryQueryHandler: GetRepositoryQueryHandler,
		createRepositoryCommandHandler: CreateRepositoryCommandHandler,
		updateRepositoryCommandHandler: UpdateRepositoryCommandHandler,
	) {
		this.getAllRepositoriesQueryHandler = getAllRepositoriesQueryHandler;
		this.getRepositoryQueryHandler = getRepositoryQueryHandler;
		this.createRepositoryCommandHandler = createRepositoryCommandHandler;
		this.updateRepositoryCommandHandler = updateRepositoryCommandHandler;
	}

	async getAllRepositories() {
		return await this.getAllRepositoriesQueryHandler.handle();
	}

	async getRepository(query: GetRepositoryQuery) {
		return await this.getRepositoryQueryHandler.handle(query);
	}

	async createRepository(command: CreateRepositoryCommand) {
		return await this.createRepositoryCommandHandler.handle(command);
	}

	async updateRepository(command: UpdateRepositoryCommand) {
		return await this.updateRepositoryCommandHandler.handle(command);
	}
}
