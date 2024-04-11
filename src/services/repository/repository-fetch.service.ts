import type { RepositoryBasic, RepositoryDetailed } from "../../models";
import type { RepositoryBasicRepository } from "../../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../../repositories/repository-detailed.repository";
import { RepositoryNotFoundError } from "../../utils/errors";

export class RepositoryFetchService {
	constructor(
		private repositoryBasicRepository: RepositoryBasicRepository,
		private repositoryDetailedRepository: RepositoryDetailedRepository,
	) {}

	async fetchRepository(
		repositoryId: string,
		detailed: boolean,
	): Promise<Partial<RepositoryBasic> | RepositoryDetailed | null> {
		return detailed
			? (await this.repositoryDetailedRepository.findFirst({
					where: { id: repositoryId },
				})) ?? null
			: (await this.repositoryBasicRepository.findFirst({
					where: { id: repositoryId },
				})) ?? null;
	}

	async getRepositoryOrThrow(
		repositoryId: string,
		detailed: boolean,
	): Promise<Partial<RepositoryBasic> | RepositoryDetailed | null> {
		const repository = await this.fetchRepository(repositoryId, detailed);
		if (!repository) {
			throw new RepositoryNotFoundError();
		}
		return repository;
	}
}
