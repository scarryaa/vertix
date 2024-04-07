import { Authenticator } from "../authenticators/service-layer/base.authenticator";
import { Authenticate } from "../authenticators/service-layer/decorators";
import { type UserBasic, type UserDetailed, UserRole } from "../models";
import type { UserBasicRepository } from "../repositories/user-basic.repository";
import type { UserDetailedRepository } from "../repositories/user-detailed.repository";
import { Validator } from "../validators/service-layer/base.validator";
import { Validate } from "../validators/service-layer/decorators";
import {
	type QueryOptions,
	RepositoryService,
	type RepositoryServiceConfig,
	ValidationAction,
} from "./base-repository.service";

export type UserKeys = keyof User;
export type User = UserBasic | UserDetailed;

export interface UserServiceConfig {
	config: RepositoryServiceConfig<User>;
	userBasicRepository: UserBasicRepository;
	userDetailedRepository: UserDetailedRepository;
}

export class UserService extends RepositoryService<User> {
	private static _authenticator: Authenticator = new Authenticator(
		process.env.JWT_SECRET ?? "",
	);
	private static _validator: Validator<User> = new Validator();

	private readonly userBasicRepository: UserBasicRepository;
	private readonly userDetailedRepository: UserBasicRepository;

	constructor(private readonly _config: UserServiceConfig) {
		super(_config.config);
		this.userBasicRepository = _config.userBasicRepository;
		this.userDetailedRepository = _config.userDetailedRepository;
	}

	getById(id: number): Promise<User | null> {
		return super.getById(id);
	}

	getAll(options: QueryOptions<User>): Promise<User[]> {
		// @TODO check for options
		return super.getAll(options);
	}

	@Authenticate(UserService.authenticator, UserRole.USER)
	@Validate<User>(ValidationAction.CREATE, "UserValidator", {
		requiredFields: ["name", "email", "password"] as UserKeys[],
		supportedFields: ["name", "email", "password"] as UserKeys[],
		entityDataIndex: 0,
		requireAllFields: true, // All fields required for create
	})
	create(entityData: Partial<User>, authToken: string): Promise<User> {
		// @TODO additional logic for user creation
		return super.create(entityData, authToken);
	}

	@Authenticate(UserService.authenticator, UserRole.USER)
	@Validate<User>(ValidationAction.UPDATE, "UserValidator", {
		requiredFields: ["name", "email"],
		supportedFields: ["name", "email"],
		entityDataIndex: 1,
		requireAllFields: false,
		requireAtLeastOneField: true,
	})
	update(
		id: number,
		entity_data: Partial<User>,
		owner_id: undefined | number,
		auth_token: string,
	): Promise<User> {
		// @TODO additional logic for user update
		return super.update(id, entity_data, undefined, auth_token);
	}

	@Authenticate(UserService.authenticator, UserRole.USER)
	delete(
		id: number,
		owner_id: number | undefined,
		auth_token: string,
	): Promise<void> {
		// @TODO additional logic for user deletion
		// @TODO handle case where record does not exist
		return super.delete(id, owner_id, auth_token);
	}

	static get authenticator(): Authenticator {
		if (!UserService._authenticator || process.env.JWT_SECRET === "") {
			throw new Error("Authenticator is not initialized or secret is empty.");
		}
		return UserService._authenticator;
	}

	static get validator(): Validator<User> {
		return UserService._validator;
	}

	// Helpers
	async checkUserExists(user_id: number): Promise<boolean> {
		const user = await this.userBasicRepository.getById(user_id);
		return !!user;
	}
}
