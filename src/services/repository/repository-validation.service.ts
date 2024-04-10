import type { RepositoryDetailed } from "../../models";
import type { WhereCondition } from "../../repositories/base.repository";
import type { RepositoryBasicRepository } from "../../repositories/repository-basic.repository";
import {
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
	UnauthorizedError,
} from "../../utils/errors";
import type { UserService } from "../user.service";
import type { Repository } from "./repository.service";

export class RepositoryValidationService {
	constructor(
		private repositoryBasicRepository: RepositoryBasicRepository,
		private userService: UserService,
	) {}

	async verifyRepositoryNameNotTaken(
		newName: string,
		userId: number,
		repositoryId?: number,
	): Promise<void> {
		const existingRepository = await this.repositoryBasicRepository.findFirst({
			where: {
				name: newName,
				owner_id: userId,
				id: repositoryId ? { not: repositoryId } : undefined,
			},
		});

		// Check if an existing repository was found and if it's different from the one being updated
		if (existingRepository) {
			throw new RepositoryAlreadyExistsError();
		}
	}

	async verifyUserExists(userId: number): Promise<void> {
		await this.userService.verifyUserExists({ id: userId });
	}

	async verifyRepositoryDoesNotExist(
		repositoryId: number,
    ): Promise<void> {
		await this.checkRepositoryExistence({ id: repositoryId }, false);
	}

	async verifyUserAndRepositoryExist(
		repositoryId: number | undefined,
		userId: number | undefined,
	): Promise<void> {
		if (!repositoryId) throw new RepositoryNotFoundError();
		if (userId === undefined || userId === null) {
			throw new UnauthorizedError("User ID cannot be undefined or null");
		}

		await this.verifyUserExists(userId);
		await this.checkRepositoryExistence({ id: repositoryId }, true);
	}

	private async checkRepositoryExistence(
		where: WhereCondition<Repository>,
		shouldExist: boolean,
	): Promise<void> {
		try {
			const repository = await this.repositoryBasicRepository.findFirst({
				where,
			});
			const exists = repository !== null;

			if (shouldExist && !exists) {
				throw new RepositoryNotFoundError();
			}

			if (!shouldExist && exists) {
				throw new RepositoryAlreadyExistsError();
			}
		} catch (error) {
			throw new RepositoryNotFoundError();
		}
	}

	private isRepositoryDetailed(
		repository: Partial<Repository>,
	): repository is RepositoryDetailed {
		return (
			(repository as RepositoryDetailed)?.issues !== undefined &&
			(repository as RepositoryDetailed)?.contributors !== undefined
		);
	}
}
