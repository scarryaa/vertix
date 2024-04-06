import { env } from "node:process";
import { Authenticator } from "./authenticators/base.authenticator";
import type { RepositoryBasic } from "./models";
import { PrismaRepository } from "./repositories/base.repository";
import { RepositoryBasicRepository } from "./repositories/repository-basic.repository";
import {
	RepositoryService,
	type RepositoryServiceConfig,
} from "./services/base-repository.service";
import prisma from "./utils/prisma";
import { Validator } from "./validators/base.validator";

const supportedFields: (keyof RepositoryBasic)[] = [
	"description",
	"id",
	"name",
	"owner_id",
	"visibility",
];

const requiredFields: (keyof RepositoryBasic)[] = ["id", "name"];

const authenticator = new Authenticator(env.JWT_SECRET ?? "");
const validator = new Validator<RepositoryBasic>(
	requiredFields,
	supportedFields,
);
const repositoryBasic = new RepositoryBasicRepository(prisma);

const repositoryConfig: RepositoryServiceConfig<RepositoryBasic> = {
	repository: repositoryBasic,
	authenticator,
	validator,
	requiredFields: requiredFields,
	supportedFields: supportedFields,
};

export const repositoryService = new RepositoryService<RepositoryBasic>(
	repositoryConfig,
);
