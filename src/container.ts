import { Authenticator } from "./authenticators/service-layer/base.authenticator";
import type { RepositoryBasic, UserBasic } from "./models";
import { RepositoryBasicRepository } from "./repositories/repository-basic.repository";
import { RepositoryDetailedRepository } from "./repositories/repository-detailed.repository";
import { UserBasicRepository } from "./repositories/user-basic.repository";
import { UserDetailedRepository } from "./repositories/user-detailed.repository";
import {
	RepositoryRepositoryService,
	type RepositoryRepositoryServiceConfig,
} from "./services/repository.service";
import { UserService, type UserServiceConfig } from "./services/user.service";
import prisma from "./utils/prisma";
import { ServiceLocator } from "./utils/service-locator";
import { Validator } from "./validators/service-layer/base.validator";

export class Container {
	private static instance: Container;

	private repositoryService: RepositoryRepositoryService;
	private userService: UserService;

	private constructor() {
		const userBasicRepository = new UserBasicRepository(prisma);
		const userDetailedRepository = new UserDetailedRepository(prisma);
		const userConfig: UserServiceConfig = {
			config: {
				repository: userBasicRepository,
			},
			userBasicRepository: userBasicRepository,
			userDetailedRepository: userDetailedRepository,
		};
		this.userService = new UserService(userConfig);

		if (!process.env.JWT_SECRET) {
			throw new Error("JWT_SECRET environment variable is not set");
		}
		const authenticator = new Authenticator(process.env.JWT_SECRET);
		const repositoryValidator = new Validator<RepositoryBasic>();
		const userValidator = new Validator<UserBasic>();

		// Register the validators
		ServiceLocator.registerValidator("RepositoryValidator", repositoryValidator);
		ServiceLocator.registerValidator("UserValidator", userValidator);

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
			authenticator: authenticator,
			validator: repositoryValidator,
		};
		this.repositoryService = new RepositoryRepositoryService(repositoryConfig);
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
}
