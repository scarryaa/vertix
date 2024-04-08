import { Authenticator } from "./authenticators/service-layer/base.authenticator";
import type { RepositoryBasic, Star, UserBasic } from "./models";
import { RepositoryBasicRepository } from "./repositories/repository-basic.repository";
import { RepositoryDetailedRepository } from "./repositories/repository-detailed.repository";
import { StarRepository } from "./repositories/star.repository";
import { UserBasicRepository } from "./repositories/user-basic.repository";
import { UserDetailedRepository } from "./repositories/user-detailed.repository";
import {
	RepositoryRepositoryService,
	type RepositoryRepositoryServiceConfig,
} from "./services/repository.service";
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
		if (!process.env.JWT_SECRET) {
			throw new Error("JWT_SECRET environment variable is not set");
		}

		const userAuthenticator = new Authenticator(process.env.JWT_SECRET);
		const userValidator = new Validator<UserBasic>();
		const userBasicRepository = new UserBasicRepository(prisma);
		const userDetailedRepository = new UserDetailedRepository(prisma);
		const userConfig: UserServiceConfig = {
			config: {
				repository: userBasicRepository,
			},
			userBasicRepository: userBasicRepository,
			userDetailedRepository: userDetailedRepository,
			authenticator: userAuthenticator,
			validator: userValidator,
		};
		this.userService = new UserService(userConfig);

		const repositoryAuthenticator = new Authenticator(process.env.JWT_SECRET);
		const repositoryValidator = new Validator<RepositoryBasic>();
		const repositoryBasicRepository = new RepositoryBasicRepository(prisma);
		const repositoryDetailedRepository = new RepositoryDetailedRepository(
			prisma,
		);
		const repositoryConfig: RepositoryRepositoryServiceConfig = {
			config: {
				repository: repositoryBasicRepository,
			},
			repositoryBasicRepository: repositoryBasicRepository,
			repositoryDetailedRepository: repositoryDetailedRepository,
			userService: this.userService,
			authenticator: repositoryAuthenticator,
			validator: repositoryValidator,
		};
		this.repositoryService = new RepositoryRepositoryService(repositoryConfig);

		const starAuthenticator = new Authenticator(process.env.JWT_SECRET);
		const starValidator = new Validator<Star>();
		const starRepository = new StarRepository(prisma);
		const starConfig: StarServiceConfig = {
			authenticator: starAuthenticator,
			starRepository: starRepository,
			validator: starValidator,
			userService: this.userService,
			repositoryService: this.repositoryService,
		};
		this._starService = new StarService(starConfig);

		// Register services
		ServiceLocator.registerValidator("UserValidator", userValidator);
		ServiceLocator.registerValidator(
			"RepositoryValidator",
			repositoryValidator,
		);
		ServiceLocator.registerValidator("StarValidator", new Validator<Star>());
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
