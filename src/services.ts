import { CollaboratorRepository } from "./repositories/collaborator.repository";
import { RepositoryBasicRepositoryImpl } from "./repositories/repository-basic.repository";
import { UserRepositoryImpl } from "./repositories/user.repository";
import { CollaboratorService } from "./services/collaborator.service";
import { RepositoryService } from "./services/repository.service";
import { UserService } from "./services/user.service";
import prisma from "./utils/prisma";

const userRepo = new UserRepositoryImpl(prisma);
const collaboratorRepo = new CollaboratorRepository(prisma);
const repositoryRepo = new RepositoryBasicRepositoryImpl(prisma);

const userService = new UserService(userRepo);
const collaboratorService = new CollaboratorService(collaboratorRepo);
const repositoryService = new RepositoryService(
	repositoryRepo,
	collaboratorRepo,
);

export { repositoryService, userService, collaboratorService };
