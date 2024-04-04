import { CollaboratorRepository } from "./repositories/collaborator.repository";
import { RepositoryRepository } from "./repositories/repository.repository";
import { UserRepository } from "./repositories/user.repository";
import { CollaboratorService } from "./services/collaborator.service";
import { RepositoryService } from "./services/repository.service";
import { UserService } from "./services/user.service";

const userRepo = new UserRepository();
const collaboratorRepo = new CollaboratorRepository();
const repositoryRepo = new RepositoryRepository();

const userService = new UserService(userRepo);
const collaboratorService = new CollaboratorService(collaboratorRepo);
const repositoryService = new RepositoryService(repositoryRepo, collaboratorRepo)

export { repositoryService, userService, collaboratorService };