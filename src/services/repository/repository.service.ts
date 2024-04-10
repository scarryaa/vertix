import type { Authenticator } from "../../authenticators/service-layer/base.authenticator";
import type { RepositoryBasic, RepositoryDetailed } from "../../models";
import type { QueryOptions } from "../../repositories/base.repository";
import type { RepositoryBasicRepository } from "../../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../../repositories/repository-detailed.repository";
import { RepositoryNotFoundError } from "../../utils/errors";
import type { Validator } from "../../validators/service-layer/base.validator";
import {
	type Validatable,
	Validate,
} from "../../validators/service-layer/decorators";
import {
	RepositoryService,
	type RepositoryServiceConfig,
	ValidationAction,
} from "../base-repository.service";
import type { RepositoryAuthorizationService } from "./repository-authorization.service";
import type { RepositoryFetchService } from "./repository-fetch.service";
import type { RepositoryValidationService } from "./repository-validation.service";

export type Repository = RepositoryBasic | RepositoryDetailed;
export type RepositoryServices = {
	repositoryBasicRepository: RepositoryBasicRepository;
	repositoryDetailedRepository: RepositoryDetailedRepository;
	authenticator: Authenticator;
	validator: Validator<Repository>;
	repositoryAuthzService: RepositoryAuthorizationService;
	repositoryValidationService: RepositoryValidationService;
	repositoryFetchService: RepositoryFetchService;
};

export interface RepositoryRepositoryServiceConfig {
	config: RepositoryServiceConfig<Repository>;
}

export class RepositoryRepositoryService
	extends RepositoryService<Repository>
	implements Validatable<Repository>
{
	private _authenticator: Authenticator;
	private _validator: Validator<Repository>;

	private readonly repositoryBasicRepository: RepositoryBasicRepository;
	private readonly repositoryDetailedRepository: RepositoryDetailedRepository;
	private readonly repositoryAuthzService: RepositoryAuthorizationService;
	private readonly repositoryValidationService: RepositoryValidationService;
	private readonly repositoryFetchService: RepositoryFetchService;

	constructor(
		private readonly _config: RepositoryRepositoryServiceConfig,
		private readonly _services: RepositoryServices,
	) {
		super(_config.config);
		this.repositoryBasicRepository = _services.repositoryBasicRepository;
		this.repositoryDetailedRepository = _services.repositoryDetailedRepository;
		this._authenticator = _services.authenticator;
		this._validator = _services.validator;
		this.repositoryAuthzService = _services.repositoryAuthzService;
		this.repositoryValidationService = _services.repositoryValidationService;
		this.repositoryFetchService = _services.repositoryFetchService;
	}

	async getById(
		id: number,
		detailed = false,
	): Promise<Partial<Repository> | null> {
		return this.repositoryFetchService.getRepositoryOrThrow(id, detailed);
	}

	async getAll(
		options: QueryOptions<Repository>,
		auth_token: undefined | string,
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
		const user_id =
		await this.authenticateAndAuthorize(auth_token, undefined, "create");
		await this.performRepositoryCreationChecks(repository_data, user_id);
		return this.repositoryBasicRepository.create(repository_data);
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
		const user_id =
		await this.authenticateAndAuthorize(auth_token, repository_id, "update");
		await this.performRepositoryUpdateChecks(
			entityData,
			user_id,
			repository_id,
		);

		// @TODO re-check this so we can make it super.update()
		return this.repositoryBasicRepository.update(repository_id, entityData);
	}

	async delete(
		repository_id: number,
		owner_id: number | undefined,
		auth_token: string,
	): Promise<void> {
		const user_id =
		await this.authenticateAndAuthorize(auth_token, repository_id, "delete");
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

	private async authenticateAndAuthorize(
		auth_token: string,
		repository_id?: number,
		action: "create" | "update" | "delete" = "create",
	): Promise<number> {
		const user_id =
			await this.repositoryAuthzService.authenticateUser(auth_token);
		if (repository_id) {
			const repository =
				(await this.repositoryFetchService.getRepositoryOrThrow(
					repository_id,
					true,
				)) as RepositoryDetailed;
			switch (action) {
				case "update":
					await this.throwIfNotRepositoryOwnerOrContributor(
						user_id,
						repository,
					);
					break;
				case "delete":
					await this.repositoryAuthzService.throwIfNotRepositoryOwner(
						user_id,
						repository.owner_id,
					);
					break;
			}
		}
		return user_id;
	}

	private async throwIfNotRepositoryOwnerOrContributor(
		user_id: number,
		repository: RepositoryDetailed,
	): Promise<void> {
		await this.repositoryAuthzService.throwIfNotRepositoryOwnerOrContributor(
			user_id,
			repository,
		);
	}

	private async performRepositoryCreationChecks(
		repositoryData: Partial<Repository> & Pick<Repository, "name">,
		user_id: number,
	): Promise<void> {
		await this.repositoryValidationService.verifyUserExists(user_id);
		await this.repositoryValidationService.verifyRepositoryNameNotTaken(
			repositoryData.name,
			user_id,
		);
	}

	private async performRepositoryUpdateChecks(
		repositoryData: Partial<Repository>,
		user_id: number,
		repository_id: number,
	): Promise<void> {
		await this.repositoryValidationService.verifyUserAndRepositoryExist(
			repository_id,
			user_id,
		);

		// Verify user is owner or contributor of repository
		const repository = (await this.repositoryFetchService.getRepositoryOrThrow(
			repository_id,
			true,
		)) as RepositoryDetailed;
		await this.repositoryAuthzService.throwIfNotRepositoryOwnerOrContributor(
			user_id,
			repository,
		);

		// Check if name is already taken by owner (if name is being updated)
		if (repositoryData.name && repositoryData.name !== repository?.name) {
			await this.repositoryValidationService.verifyRepositoryNameNotTaken(
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
		await this.repositoryValidationService.verifyUserAndRepositoryExist(
			repository_id,
			user_id,
		);

		// Verify user is owner
		const repository = await this.repositoryFetchService.getRepositoryOrThrow(
			repository_id,
			true,
		);
		if (!repository?.owner_id) {
			throw new Error(`Repository ${repository_id} does not have an owner`);
		}
		await this.repositoryAuthzService.throwIfNotRepositoryOwner(
			user_id,
			repository?.owner_id,
		);
	}
}
