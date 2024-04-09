import type { Authenticator } from "../authenticators/service-layer/base.authenticator";
import type { AuthzService } from "../authorization/authorization.service";
import type { RepositoryBasic, RepositoryDetailed } from "../models";
import type {
	QueryOptions,
	WhereCondition,
} from "../repositories/base.repository";
import type { RepositoryBasicRepository } from "../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../repositories/repository-detailed.repository";
import {
	NotFoundError,
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
	UnauthorizedError,
} from "../utils/errors";
import type { Validator } from "../validators/service-layer/base.validator";
import {
	type Validatable,
	Validate,
} from "../validators/service-layer/decorators";
import {
	verifyEntityDoesNotExist,
	verifyEntityExists,
} from "../validators/service-layer/util";
import {
	RepositoryService,
	type RepositoryServiceConfig,
	ValidationAction,
} from "./base-repository.service";
import type { UserService } from "./user.service";

type Repository = RepositoryBasic | RepositoryDetailed;

export interface RepositoryRepositoryServiceConfig {
	config: RepositoryServiceConfig<Repository>;
	repositoryBasicRepository: RepositoryBasicRepository;
	repositoryDetailedRepository: RepositoryDetailedRepository;
	userService: UserService;
	authenticator: Authenticator;
	validator: Validator<Repository>;
	authzService: AuthzService;
}

export class RepositoryRepositoryService
	extends RepositoryService<Repository>
	implements Validatable<Repository>
{
	private _authenticator: Authenticator;
	private _authzService: AuthzService;
	private _validator: Validator<Repository>;

	private readonly repositoryBasicRepository: RepositoryBasicRepository;
	private readonly repositoryDetailedRepository: RepositoryDetailedRepository;
	private readonly userService: UserService;

	constructor(private readonly _config: RepositoryRepositoryServiceConfig) {
		super(_config.config);
		this.repositoryBasicRepository = _config.repositoryBasicRepository;
		this.repositoryDetailedRepository = _config.repositoryDetailedRepository;
		this.userService = _config.userService;
		this._authenticator = _config.authenticator;
		this._validator = _config.validator;
		this._authzService = _config.authzService;
	}

	async getById(id: number): Promise<Partial<Repository> | null> {
		return this.getRepositoryOrThrow(id, false);
	}

	async getByIdDetailed(
		id: number,
	): Promise<Partial<RepositoryDetailed> | null> {
		return this.getRepositoryOrThrow(id, true);
	}

	async getAll(options: QueryOptions<Repository>): Promise<RepositoryBasic[]> {
		return this.repositoryBasicRepository.getAll(options);
	}

	async getAllDetailed(
		options: QueryOptions<RepositoryDetailed>,
	): Promise<RepositoryDetailed[] | Partial<RepositoryDetailed>[] | undefined> {
		return this.repositoryDetailedRepository.getAll(options);
	}

	@Validate<Repository>(ValidationAction.CREATE, "RepositoryValidator", {
		requiredFields: ["name", "visibility"],
		supportedFields: ["description", "visibility", "name"],
		entityDataIndex: 0,
		requireAllFields: true, // All fields required for create
	})
	async create(
		repository_data: Pick<Repository, "name" | "visibility"> &
			Partial<Pick<Repository, "description">>,
		auth_token: string,
	): Promise<Repository> {
		const user_id = await this._authzService.authenticateUser(auth_token);
		await this.performRepositoryCreationChecks(repository_data, user_id);
		return await super.create(repository_data, auth_token);
	}

	@Validate<Repository>(ValidationAction.UPDATE, "RepositoryValidator", {
		requiredFields: ["description", "name", "owner_id", "visibility"],
		supportedFields: ["description", "name", "owner_id", "visibility"],
		entityDataIndex: 1,
		requireAllFields: false,
		requireAtLeastOneField: true,
	})
	async update(
		repository_id: number,
		entityData: Partial<Repository>,
		owner_id: number | undefined,
		auth_token: string,
	): Promise<Repository | Partial<Repository>> {
		const user_id = await this._authzService.authenticateUser(auth_token);
		await this.performRepositoryUpdateChecks(
			entityData,
			user_id,
			repository_id,
		);

		return super.update(repository_id, entityData, owner_id, auth_token);
	}

	async delete(
		repository_id: number,
		owner_id: number | undefined,
		auth_token: string,
	): Promise<void> {
		const user_id = await this._authzService.authenticateUser(auth_token);
		await this.performRepositoryDeletionChecks(repository_id, user_id);
		return super.delete(repository_id, owner_id, auth_token);
	}

	get authenticator(): Authenticator {
		return this._authenticator;
	}

	get validator(): Validator<Repository> {
		return this._validator;
	}

	// Helpers

	private async performRepositoryCreationChecks(
		repositoryData: Partial<Repository>,
		user_id: number,
	): Promise<void> {
		// Verify that the user exists
		await this.userService.verifyUserExists({ id: user_id });

		// Verify that the repository does not already exist
		await this.verifyRepositoryDoesNotExist({
			id: repositoryData.id,
			name: repositoryData.name,
		});
	}

	private async performRepositoryUpdateChecks(
		repositoryData: Partial<Repository>,
		user_id: number,
		repository_id: number,
	): Promise<void> {
		// Make sure user_id is valid
		this.verifyUserIdIsValid(user_id);

		// Verify user exists
		await this.userService.verifyUserExists({ id: user_id });

		// Verify repository exists
		await this.verifyRepositoryExists({ id: repository_id });

		// Verify user is owner or contributor of repository
		const repository = (await this.getRepositoryOrThrow(
			repository_id,
			true,
		)) as RepositoryDetailed;
		await this._authzService.throwIfNotRepositoryOwnerOrContributor(
			user_id,
			repository,
		);

		// Check if name is already taken by owner (if name is being updated)
		if (repositoryData.name && repositoryData.name !== repository.name) {
			await this.verifyRepositoryNameNotTaken(
				repositoryData.name,
				user_id,
				repository_id,
			);
		}
	}

	private async performRepositoryDeletionChecks(
		repository_id: number,
		user_id: number,
	): Promise<void> {
		// Verify user exists
		this.userService.verifyUserExists({ id: user_id });

		// Verify repository exists
		await this.verifyRepositoryExists({ id: repository_id });

		// Verify user is owner
		const repository = await this.getRepositoryOrThrow(repository_id, false);

		if (!repository?.owner_id) {
			throw new Error(`Repository ${repository_id} has no owner`);
		}
		await this._authzService.throwIfNotRepositoryOwner(user_id, {
			owner_id: repository?.owner_id,
		});
	}

	private async getRepositoryOrThrow(
		repository_id: number,
		detailed: boolean,
	): Promise<Partial<RepositoryBasic> | RepositoryDetailed | null> {
		let repository:
			| Partial<RepositoryBasic>
			| RepositoryDetailed
			| null
			| undefined = null;
		if (!detailed) {
			repository = await this.repositoryBasicRepository.findFirst({
				where: { id: repository_id },
			});
		} else {
			repository = await this.repositoryDetailedRepository.findFirst({
				where: { id: repository_id },
			});
		}

		if (!repository) {
			throw new RepositoryNotFoundError();
		}
		return repository;
	}

	private async verifyRepositoryExists(
		where: WhereCondition<Repository>,
	): Promise<void> {
		await verifyEntityExists({
			repository: this.repositoryBasicRepository,
			condition: where,
			NotFoundError: RepositoryNotFoundError,
		});
	}

	private async verifyRepositoryDoesNotExist(
		where: WhereCondition<Repository>,
	): Promise<void> {
		await verifyEntityDoesNotExist({
			repository: this.repositoryBasicRepository,
			condition: where,
			FoundError: RepositoryAlreadyExistsError,
		});
	}

	private isRepositoryDetailed(
		repository: Partial<Repository>,
	): repository is RepositoryDetailed {
		return (
			(repository as RepositoryDetailed)?.issues !== undefined &&
			(repository as RepositoryDetailed)?.contributors !== undefined
		);
	}

	private async verifyRepositoryNameNotTaken(
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
		if (existingRepository && existingRepository.id !== repositoryId) {
			throw new RepositoryAlreadyExistsError();
		}
	}

	private async verifyUserIdIsValid(userId: number): Promise<void> {
		if (userId === undefined || userId === null) {
			throw new UnauthorizedError("User ID cannot be undefined or null");
		}
	}
}
