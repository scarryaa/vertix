import type { Authenticator } from "../authenticators/service-layer/base.authenticator";
import {
	type RepositoryBasic,
	type RepositoryDetailed,
	UserRole,
} from "../models";
import type { QueryOptions } from "../repositories/base.repository";
import type { RepositoryBasicRepository } from "../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../repositories/repository-detailed.repository";
import {
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
	UnauthorizedError,
} from "../utils/errors";
import { UserDoesNotExistError } from "../utils/errors/user.error";
import type { Validator } from "../validators/service-layer/base.validator";
import {
	type Validatable,
	Validate,
} from "../validators/service-layer/decorators";
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
}

export class RepositoryRepositoryService
	extends RepositoryService<Repository>
	implements Validatable<Repository>
{
	private _authenticator: Authenticator;
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
	}

	async getById(id: number): Promise<Partial<Repository> | null> {
		// Check if repository exists
		const repository = await this.repositoryBasicRepository.findFirst({
			where: { id },
		});

		if (repository === null || repository === undefined)
			throw new RepositoryNotFoundError();

		return repository;
	}

	async getByIdDetailed(id: number): Promise<RepositoryDetailed | null> {
		// Check if repository exists
		const repository = await this.repositoryDetailedRepository.findFirst({
			where: { id },
		});

		if (repository === null || repository === undefined)
			throw new RepositoryNotFoundError();

		return repository;
	}

	getAll(options: QueryOptions<Repository> = {}): Promise<Repository[]> {
		return this.repositoryBasicRepository.getAll(options);
	}

	getAllDetailed(
		options: QueryOptions<RepositoryDetailed> = {},
	): Promise<RepositoryDetailed[]> {
		return this.repositoryDetailedRepository.getAll(options);
	}

	@Validate<Repository>(ValidationAction.CREATE, "RepositoryValidator", {
		requiredFields: ["name", "visibility"],
		supportedFields: ["description", "visibility", "name"],
		entityDataIndex: 0,
		requireAllFields: true, // All fields required for create
	})
	async create(
		entity_data: Pick<Repository, "name" | "visibility"> &
			Partial<Pick<Repository, "description">>,
		auth_token: string,
	): Promise<Repository> {
		// Perform authentication manually
		const { user_id, role } = this.authenticator.authenticate(auth_token, [
			UserRole.USER,
		]);

		// Check if repository already exists
		if (await this.checkRepositoryExists(entity_data.name, user_id)) {
			throw new RepositoryAlreadyExistsError();
		}

		// Check if owner exists
		if (!(await this.checkOwnerExists(user_id))) {
			throw new UserDoesNotExistError();
		}

		// Proceed with repository creation
		return super.create({ ...entity_data, owner_id: user_id });
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
		// Check if repository exists
		const foundRepository = await this.getById(repository_id);
		if (foundRepository === null || foundRepository === undefined)
			throw new RepositoryNotFoundError();

		// Check if user exists
		if (
			entityData.owner_id &&
			!(await this.checkOwnerExists(entityData.owner_id))
		) {
			throw new UserDoesNotExistError();
		}

		// Check if user is owner or collaborator
		// Perform authentication manually
		const { user_id, role } = this.authenticator.authenticate(auth_token, [
			UserRole.USER,
		]);
		const isOwner = await this.checkIsOwnerOrContributor(
			user_id,
			repository_id,
		);
		if (!isOwner) {
			throw new UnauthorizedError();
		}

		// Check if name is already taken by owner
		if (entityData.name && entityData.owner_id) {
			if (
				await this.checkRepositoryExists(entityData.name, entityData.owner_id)
			) {
				throw new RepositoryAlreadyExistsError();
			}
		}

		return super.update(repository_id, entityData, owner_id, auth_token);
	}

	async delete(
		repository_id: number,
		owner_id: number | undefined,
		auth_token: string,
	): Promise<void> {
		// Check if repository exists
		const repository = await this.getById(repository_id);
		if (!repository) {
			throw new RepositoryNotFoundError();
		}

		// Check if user is owner of repository
		// Perform authentication manually
		const { user_id } = this.authenticator.authenticate(auth_token, [
			UserRole.USER,
		]);

		const isOwner = await this.checkIsOwner(user_id, repository_id);
		if (!isOwner) {
			throw new UnauthorizedError();
		}

		return super.delete(repository_id, owner_id, auth_token);
	}

	get authenticator(): Authenticator {
		return this._authenticator;
	}

	get validator(): Validator<Repository> {
		return this._validator;
	}

	// Helpers

	async checkRepositoryExists(
		name: string,
		owner_id: number,
	): Promise<boolean> {
		const repository = await this.repositoryBasicRepository.findFirst({
			where: { name, owner_id },
		});

		if (repository === null || repository === undefined) return false;

		return true;
	}

	async checkOwnerExists(owner_id: number): Promise<boolean> {
		return this.userService.checkUserExists(owner_id);
	}

	async checkIsOwner(
		owner_id: number,
		repository_id: number,
	): Promise<boolean> {
		const foundRepository = await this.getById(repository_id);
		return foundRepository?.owner_id === owner_id;
	}

	async checkIsOwnerOrContributor(
		user_id: number,
		repository_id: number,
	): Promise<boolean> {
		const repository = await this.getByIdDetailed(repository_id);
		if (!repository) {
			return false;
		}
		return (
			repository.owner_id === user_id ||
			repository.contributors?.some(
				(contributor) => contributor.user_id === user_id,
			)
		);
	}
}
