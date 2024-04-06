import assert from "node:assert";
import { Authenticator } from "./authenticators/service-layer/base.authenticator";
import type { RepositoryBasic } from "./models";
import { RepositoryBasicRepository } from "./repositories/repository-basic.repository";
import { RepositoryDetailedRepository } from "./repositories/repository-detailed.repository";
import type { RepositoryServiceConfig } from "./services/base-repository.service";
import { RepositoryRepositoryService } from "./services/repositories/repository.service";
import prisma from "./utils/prisma";
import { Validator } from "./validators/service-layer/base.validator";

const repositoryBasic = new RepositoryBasicRepository(prisma);
const repositoryDetailed = new RepositoryDetailedRepository(prisma);

const repositoryConfig: RepositoryServiceConfig<RepositoryBasic> = {
	repository: repositoryBasic,
};

export const repositoryRepositoryService = new RepositoryRepositoryService({
	repositoryBasicRepository: repositoryBasic,
	repositoryDetailedRepository: repositoryDetailed,
	config: repositoryConfig,
});
