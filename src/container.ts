import * as dotenv from "dotenv";
import { Authenticator } from "./authenticators/service-layer/base.authenticator";
import { AuthzService } from "./authorization/authorization.service";
import type { RepositoryBasic, Star, UserBasic } from "./models";
import { RepositoryBasicRepository } from "./repositories/repository-basic.repository";
import { RepositoryDetailedRepository } from "./repositories/repository-detailed.repository";
import { StarRepository } from "./repositories/star.repository";
import { UserBasicRepository } from "./repositories/user-basic.repository";
import { UserDetailedRepository } from "./repositories/user-detailed.repository";
import { RepositoryAuthorizationService } from "./services/repository/repository-authorization.service";
import { RepositoryFetchService } from "./services/repository/repository-fetch.service";
import { RepositoryValidationService } from "./services/repository/repository-validation.service";
import {
	RepositoryRepositoryService,
	type RepositoryRepositoryServiceConfig,
	type RepositoryServices,
} from "./services/repository/repository.service";
import { StarService, type StarServiceConfig } from "./services/star.service";
import { UserService, type UserServiceConfig } from "./services/user.service";
import prisma from "./utils/prisma";
import { ServiceLocator } from "./utils/service-locator";
import { Validator } from "./validators/service-layer/base.validator";
export class Container {
	private static instance: Container;

	private repositoryService: RepositoryRepositoryService;
	private userService: UserService;
	private _starService: StarService;

	private constructor() {
		this.checkEnvironmentVariables();
		// biome-ignore lint/style/noNonNullAssertion: We make sure that the secret is not null above
		const authenticator = new Authenticator(process.env.JWT_SECRET!);

		const userValidator = new Validator<UserBasic>();
		const userBasicRepository = new UserBasicRepository(prisma);
		const userDetailedRepository = new UserDetailedRepository(prisma);
		this.userService = this.setupUserService(
			userBasicRepository,
			userDetailedRepository,
			authenticator,
			userValidator,
		);

		const authzService = new AuthzService(authenticator, this.userService);
		this.repositoryService = this.setupRepositoryService(
			authenticator,
			authzService,
			userBasicRepository,
		);

		const starValidator = new Validator<Star>();
		const starRepository = new StarRepository(prisma);
		this._starService = this.setupStarService(
			authenticator,
			starRepository,
			starValidator,
		);

		this.registerValidators(
			userValidator,
			new Validator<RepositoryBasic>(),
			starValidator,
		);
	}

	private async checkEnvironmentVariables(): Promise<void> {
		process.env.ENVIRONMENT = process.env.NODE_ENV ?? "development";
		await dotenv.config({ override: true, path: `./.env.${process.env.ENVIRONMENT}` });

		console.log(`Environment: ${process.env.ENVIRONMENT}`);
		if (!process.env.JWT_SECRET) {
			throw new Error("JWT_SECRET environment variable is not set");
		}
	}

	private setupUserService(
		userBasicRepository: UserBasicRepository,
		userDetailedRepository: UserDetailedRepository,
		authenticator: Authenticator,
		validator: Validator<UserBasic>,
	): UserService {
		const userConfig: UserServiceConfig = {
			config: {
				repository: userBasicRepository,
			},
			userBasicRepository,
			userDetailedRepository,
			authenticator,
			validator,
		};
		return new UserService(userConfig);
	}

	private setupRepositoryService(
		authenticator: Authenticator,
		authzService: AuthzService,
		userBasicRepository: UserBasicRepository,
	): RepositoryRepositoryService {
		const repositoryValidator = new Validator<RepositoryBasic>();
		const repositoryBasicRepository = new RepositoryBasicRepository(prisma);
		const repositoryDetailedRepository = new RepositoryDetailedRepository(
			prisma,
		);
		const repositoryFetchService = new RepositoryFetchService(
			repositoryBasicRepository,
			repositoryDetailedRepository,
		);
		const repositoryValidationService = new RepositoryValidationService(
			repositoryBasicRepository,
			this.userService,
		);
		const repositoryAuthzService = new RepositoryAuthorizationService(
			authzService,
		);
		const repositoryConfig: RepositoryRepositoryServiceConfig = {
			config: {
				repository: repositoryBasicRepository,
			},
		};
		const services: RepositoryServices = {
			authenticator,
			repositoryBasicRepository,
			repositoryDetailedRepository,
			repositoryFetchService,
			repositoryValidationService,
			repositoryAuthzService,
			validator: repositoryValidator,
		};
		return new RepositoryRepositoryService(repositoryConfig, services);
	}

	private setupStarService(
		authenticator: Authenticator,
		starRepository: StarRepository,
		validator: Validator<Star>,
	): StarService {
		const starConfig: StarServiceConfig = {
			authenticator,
			starRepository,
			validator,
			userService: this.userService,
			repositoryService: this.repositoryService,
		};
		return new StarService(starConfig);
	}

	private registerValidators(
		userValidator: Validator<UserBasic>,
		repositoryValidator: Validator<RepositoryBasic>,
		starValidator: Validator<Star>,
	): void {
		ServiceLocator.registerValidator("UserValidator", userValidator);
		ServiceLocator.registerValidator(
			"RepositoryValidator",
			repositoryValidator,
		);
		ServiceLocator.registerValidator("StarValidator", starValidator);
	}

	public static getInstance(): Container {
		if (!Container.instance) {
			Container.instance = new Container();
		}
		return Container.instance;
	}

	public getRepositoryService(): RepositoryRepositoryService {
		return this.repositoryService;
	}

	public getUserService(): UserService {
		return this.userService;
	}

	public getStarService(): StarService {
		return this._starService;
	}
}
