import { Authenticator } from "../../authenticators/service-layer/base.authenticator";
import { Authenticate } from "../../authenticators/service-layer/decorators";
import {
	type RepositoryBasic,
	type RepositoryDetailed,
	UserRole,
} from "../../models";
import type { RepositoryBasicRepository } from "../../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../../repositories/repository-detailed.repository";
import { Validator } from "../../validators/service-layer/base.validator";
import {
	Validate,
	ValidateOptions,
} from "../../validators/service-layer/decorators";
import {
	type QueryOptions,
	RepositoryService,
	type RepositoryServiceConfig,
	ValidationAction,
} from "../base-repository.service";

type Repository = RepositoryBasic | RepositoryDetailed;

export interface RepositoryRepositoryServiceConfig {
	config: RepositoryServiceConfig<Repository>;
	repositoryBasicRepository: RepositoryBasicRepository;
	repositoryDetailedRepository: RepositoryDetailedRepository;
}

export class RepositoryRepositoryService extends RepositoryService<Repository> {
	private static _authenticator: Authenticator = new Authenticator(
		process.env.JWT_SECRET ?? "",
	);
	private static _validator: Validator<Repository> = new Validator();
	private readonly repositoryBasicRepository: RepositoryBasicRepository;
	private readonly repositoryDetailedRepository: RepositoryDetailedRepository;

	constructor(private readonly _config: RepositoryRepositoryServiceConfig) {
		super(_config.config);
		this.repositoryBasicRepository = _config.repositoryBasicRepository;
		this.repositoryDetailedRepository = _config.repositoryDetailedRepository;
	}

	getById(id: number): Promise<Repository | null> {
		return super.getById(id);
	}

	getAll(options: QueryOptions<Repository>): Promise<Repository[]> {
		// @TODO check for options
		return super.getAll(options);
	}

	@Authenticate(RepositoryRepositoryService.authenticator, UserRole.USER)
	@Validate<
		Repository,
		Validator<Repository>,
		Promise<Repository>,
		[Partial<Repository>, string]
	>(RepositoryRepositoryService.validator, ValidationAction.CREATE, {
		requiredFields: ["name", "owner_id", "visibility"],
		supportedFields: ["description", "owner_id", "visibility", "name"],
		entityDataIndex: 0,
		requireAllFields: true, // All fields required for create
	})
	create(
		entityData: Partial<Repository>,
		authToken: string,
	): Promise<Repository> {
		// @TODO check if user is owner of repo or contributor
		return super.create(entityData, authToken);
	}

	@Authenticate(RepositoryRepositoryService.authenticator, UserRole.USER)
	@Validate<
		Repository,
		Validator<Repository>,
		Promise<Repository>,
		[number, Partial<Repository>, string]
	>(RepositoryRepositoryService.validator, ValidationAction.UPDATE, {
		requiredFields: ["description", "name", "owner_id", "visibility"],
		supportedFields: ["description", "name", "owner_id", "visibility"],
		entityDataIndex: 1,
		requireAllFields: false,
		requireAtLeastOneField: true,
	})
	update(
		id: number,
		entityData: Partial<Repository>,
		authToken: string,
	): Promise<Repository> {
		// @TODO check if user is owner of repo or contributor
		return super.update(id, entityData, authToken);
	}

	@Authenticate(RepositoryRepositoryService.authenticator, UserRole.USER)
	delete(id: number, authToken: string): Promise<void> {
		// @TODO check if user is owner of repo or contributor
		// @TODO handle case where record does not exist
		return super.delete(id, authToken);
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
}
