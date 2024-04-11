import bcrypt from "bcrypt";
import type { Authenticator } from "../authenticators/service-layer/base.authenticator";
import { Authenticate } from "../authenticators/service-layer/decorators";
import { type UserBasic, type UserDetailed, UserRole } from "../models";
import type {
	QueryOptions,
	WhereCondition,
} from "../repositories/base.repository";
import type { UserBasicRepository } from "../repositories/user-basic.repository";
import type { UserDetailedRepository } from "../repositories/user-detailed.repository";
import { UnauthorizedError } from "../utils/errors";
import {
	UserAlreadyExistsError,
	UserDoesNotExistError,
	UserNotFoundError,
} from "../utils/errors/user.error";
import type { Validator } from "../validators/service-layer/base.validator";
import { Validate } from "../validators/service-layer/decorators";
import {
	RepositoryService,
	type RepositoryServiceConfig,
	ValidationAction,
} from "./base-repository.service";

const SALT_ROUNDS = Number.parseInt(process.env.SALT_ROUNDS || "10", 10);

export type UserKeys = keyof User;
export type User = UserBasic | UserDetailed;

export interface UserServiceConfig {
	config: RepositoryServiceConfig<User>;
	userBasicRepository: UserBasicRepository;
	userDetailedRepository: UserDetailedRepository;
	authenticator: Authenticator;
	validator: Validator<User>;
}

export class UserService extends RepositoryService<User> {
	private _authenticator: Authenticator;
	private _validator: Validator<User>;

	private readonly userBasicRepository: UserBasicRepository;
	private readonly userDetailedRepository: UserDetailedRepository;

	constructor(private readonly _config: UserServiceConfig) {
		super(_config.config);
		this.userBasicRepository = _config.userBasicRepository;
		this.userDetailedRepository = _config.userDetailedRepository;
		this._authenticator = _config.authenticator;
		this._validator = _config.validator;
	}

	async getById(id: string): Promise<Partial<UserDetailed> | null> {
		const user = await this.userDetailedRepository.findFirst({ where: { id } });
		if (user === null || user === undefined) return null;

		// Check if user is deleted
		if (user?.deleted) {
			return {
				deleted: true,
				deleted_at: user.deleted_at,
				id: user.id,
			};
		}

		// Create a partial user object
		const partialUser: Partial<UserDetailed> = { ...user };

		// Remove sensitive keys
		partialUser.password = undefined;
		partialUser.two_factor_enabled = undefined;
		partialUser.reset_password_token = undefined;
		partialUser.reset_password_expires = undefined;
		partialUser.phone = undefined;

		return partialUser;
	}

	async getAll(
		options: QueryOptions<User>,
	): Promise<UserBasic[] | Partial<UserBasic>[] | undefined> {
		const users = (await super.getAll(options)) as User[];

		const filteredUsers = users.map((user) => {
			const { password, email, deleted, ...safeData } = user;

			// Check if user is deleted
			if (deleted) {
				// Return a UserBasic object representing a deleted user
				return {
					id: safeData.id,
					deleted_at: safeData.deleted_at,
					deleted: true,
				};
			}

			return safeData as UserBasic;
		});

		return filteredUsers;
	}

	@Validate<User>(ValidationAction.CREATE, "UserValidator", {
		requiredFields: ["name", "email", "password"] as UserKeys[],
		supportedFields: ["name", "email", "password"] as UserKeys[],
		entityDataIndex: 0,
		requireAllFields: true, // All fields required for create
	})
	async create(
		entityData: Partial<User> & Pick<User, "password">,
		authToken?: string,
	): Promise<User> {
		const existingUser = await this.userBasicRepository.findFirst({
			where: {
				OR: [{ email: entityData.email }, { username: entityData.username }],
			},
		});

		if (existingUser)
			throw new UserAlreadyExistsError(
				"User with this email or username already exists.",
			);

		const hashedPassword = await bcrypt.hash(entityData.password, SALT_ROUNDS);

		return await super.create(
			{ ...entityData, password: hashedPassword },
			authToken,
		);
	}

	@Validate<User>(ValidationAction.UPDATE, "UserValidator", {
		requiredFields: ["name", "email"],
		supportedFields: ["name", "email"],
		entityDataIndex: 1,
		requireAllFields: false,
		requireAtLeastOneField: true,
	})
	async update(
		id: string,
		entity_data: Partial<User>,
		owner_id: undefined | string,
		auth_token: string,
	): Promise<Partial<User>> {
		// Check if user exists
		const user = await this.getById(id);
		if (!user || !id) throw new UserNotFoundError();

		// Check if user is owner of the account
		if (entity_data.id !== id) {
			throw new UnauthorizedError();
		}

		if (entity_data.password && id) {
			await this.updatePassword(id, entity_data.password, auth_token);
			entity_data.password = undefined;
		}

		const user_data = await this.userDetailedRepository.update(id, entity_data);

		if (!user_data) {
			throw new Error("Failed to update user.");
		}

		// Ensure the password field is not included in the response
		user_data.password = undefined;
		return user_data;
	}

	async updatePassword(
		id: string,
		password: string,
		auth_token: string,
	): Promise<void> {
		// Check if user exists
		const user = await this.getById(id);
		if (!user) throw new UserDoesNotExistError();

		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

		await this.userBasicRepository.updatePassword(id, hashedPassword);
	}

	async delete(
		id: string,
		owner_id: string | undefined,
		auth_token: string,
	): Promise<void> {
		// Check if the user exists
		const user = await this.getById(id);
		if (user === null)
			throw new UserNotFoundError("User with this id does not exist.");

		// Get the user's auth manually
		const { user_id } = await this._authenticator.authenticate(auth_token, [
			UserRole.USER,
		]);

		// Check if the user is the owner
		if (user_id !== id)
			throw new UnauthorizedError(
				"You don't have permission to delete this user.",
			);

		await super.delete(id, owner_id, auth_token);
	}

	get repositoryBasic(): UserBasicRepository {
		return this._config.userBasicRepository;
	}

	get validator(): Validator<User> {
		if (!this._validator) {
			throw new Error("Validator is not initialized.");
		}
		return this._validator;
	}

	get authenticator(): Authenticator {
		if (!this._authenticator) {
			throw new Error("Authenticator is not initialized.");
		}
		return this._authenticator;
	}

	// Helpers
	async checkUserExists(user_id: string): Promise<boolean> {
		const user = await this.getById(user_id);
		return user !== null;
	}

	public async verifyUserExists(where: WhereCondition<User>): Promise<void> {
		const user = await this.userBasicRepository.findFirst({ where });
		if (!user) {
			throw new UserDoesNotExistError();
		}
	}
}
