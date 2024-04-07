import { Authenticator } from "../authenticators/service-layer/base.authenticator";
import { Authenticate } from "../authenticators/service-layer/decorators";
import {
	type RepositoryBasic,
	type RepositoryDetailed,
	UserRole,
} from "../models";
import type { RepositoryBasicRepository } from "../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../repositories/repository-detailed.repository";
import {
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
	UnauthorizedError,
} from "../utils/errors";
import { UserDoesNotExistError } from "../utils/errors/user.error";
import { Validator } from "../validators/service-layer/base.validator";
import { Validate } from "../validators/service-layer/decorators";
import {
	type QueryOptions,
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
}

export class RepositoryRepositoryService extends RepositoryService<Repository> {
	private static _authenticator: Authenticator = new Authenticator(
		process.env.JWT_SECRET ?? "",
	);
	private static _validator: Validator<Repository> = new Validator();

	private readonly repositoryBasicRepository: RepositoryBasicRepository;
	private readonly repositoryDetailedRepository: RepositoryDetailedRepository;
	private readonly userService: UserService;

	constructor(private readonly _config: RepositoryRepositoryServiceConfig) {
		super(_config.config);
		this.repositoryBasicRepository = _config.repositoryBasicRepository;
		this.repositoryDetailedRepository = _config.repositoryDetailedRepository;
		this.userService = _config.userService;
	}

	async getById(id: number): Promise<Repository | null> {
		return super.getById(id);
	}

	async getByIdDetailed(id: number): Promise<RepositoryDetailed | null> {
		return this.repositoryDetailedRepository.getById(id);
	}

	getAll(options: QueryOptions<Repository>): Promise<Repository[]> {
		// @TODO check for options
		return super.getAll(options);
	}

	@Validate<
		Repository,
		Validator<Repository>,
		Promise<Repository>,
		[Pick<Repository, "name" | "visibility">, string]
	>(RepositoryRepositoryService.validator, ValidationAction.CREATE, {
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
		const { user_id, role } =
			RepositoryRepositoryService.authenticator.authenticate(auth_token, [
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

	@Validate<
		Repository,
		Validator<Repository>,
		Promise<Repository>,
		[number, Partial<Repository>, number, string]
	>(RepositoryRepositoryService.validator, ValidationAction.UPDATE, {
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
	): Promise<Repository> {
		// Check if repository exists
		const foundRepository = await this.getById(repository_id);
		if (!foundRepository) {
			throw new RepositoryNotFoundError();
		}

		// Check if user is owner or collaborator
		// Perform authentication manually
		const { user_id, role } =
			RepositoryRepositoryService.authenticator.authenticate(auth_token, [
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
		const { user_id, role } =
			RepositoryRepositoryService.authenticator.authenticate(auth_token, [
				UserRole.USER,
			]);
		const isOwner = await this.checkIsOwner(user_id, repository_id);
		if (!isOwner) {
			throw new UnauthorizedError();
		}

		return super.delete(repository_id, owner_id, auth_token);
	}

	static get authenticator(): Authenticator {
		if (
			!RepositoryRepositoryService._authenticator ||
			process.env.JWT_SECRET === ""
		) {
			throw new Error("Authenticator is not initialized or secret is empty.");
		}
		return RepositoryRepositoryService._authenticator;
	}

	static get validator(): Validator<Repository> {
		return RepositoryRepositoryService._validator;
	}

	// Helpers

	async checkRepositoryExists(name: string, ownerId: number): Promise<boolean> {
		const repository = await this.repositoryBasicRepository.findOne({
			name,
			owner_id: ownerId,
		});
		return !!repository;
	}

	async checkOwnerExists(ownerId: number): Promise<boolean> {
		return this.userService.checkUserExists(ownerId);
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
		repositoryId: number,
	): Promise<boolean> {
		const repository = await this.getByIdDetailed(repositoryId);
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
