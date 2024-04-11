import type { RepositoryBasic, RepositoryDetailed } from "../../models";
import type { QueryOptions } from "../../repositories/base.repository";
import type { RepositoryBasicRepository } from "../../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../../repositories/repository-detailed.repository";
import type { RepositoryFetchService } from "./repository-fetch.service";
import type { Repository } from "./types";

export type GetRepositoryByIdParams = {
	repositoryId: string;
	detailed: boolean;
};

export type GetAllRepositoriesParams = {
	options: QueryOptions<Repository>;
	detailed: boolean;
};

export type RepositoryQueryServiceServices = {
	repositoryBasicRepository: RepositoryBasicRepository;
	repositoryDetailedRepository: RepositoryDetailedRepository;
	repositoryFetchService: RepositoryFetchService;
};

export class RepositoryQueryService {
	private readonly repositoryBasicRepository: RepositoryBasicRepository;
	private readonly repositoryDetailedRepository: RepositoryDetailedRepository;
	private readonly repositoryFetchService: RepositoryFetchService;
	constructor(private readonly _services: RepositoryQueryServiceServices) {
		this.repositoryBasicRepository = _services.repositoryBasicRepository;
		this.repositoryDetailedRepository = _services.repositoryDetailedRepository;
		this.repositoryFetchService = _services.repositoryFetchService;
	}

	async getById(
		id: string,
		detailed = false,
	): Promise<Partial<Repository> | null> {
		return this.repositoryFetchService.getRepositoryOrThrow(id, detailed);
	}

	async getAll(
		options: QueryOptions<Repository>,
		detailed = false,
	): Promise<
		| RepositoryBasic[]
		| RepositoryDetailed[]
		| Partial<RepositoryDetailed>[]
		| undefined
	> {
		return detailed
			? this.repositoryDetailedRepository.getAll(options)
			: this.repositoryBasicRepository.getAll(options);
	}
}
