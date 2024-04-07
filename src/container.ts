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
