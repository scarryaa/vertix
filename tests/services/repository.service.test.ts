import { mock } from "jest-mock-extended";
import type { Authenticator } from "../../src/authenticators/service-layer/base.authenticator";
import {
	type Comment,
	type ContributorDetailed,
	ProgrammingLanguage,
	type PullRequest,
	type RepositoryBasic,
	type RepositoryDetailed,
	UserRole,
} from "../../src/models";
import type { QueryOptions } from "../../src/repositories/base.repository";
import type { RepositoryBasicRepository } from "../../src/repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../../src/repositories/repository-detailed.repository";
import { RepositoryRepositoryService } from "../../src/services/repository.service";
import type { UserService } from "../../src/services/user.service";
import {
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
} from "../../src/utils/errors";
import { UserDoesNotExistError } from "../../src/utils/errors/user.error";
import { ServiceLocator } from "../../src/utils/service-locator";
import type { Validator } from "../../src/validators/service-layer/base.validator";
import {
	MockAuthenticator,
	MockValidator,
	generateComment,
	generateContributorDetailed,
	generatePullRequest,
	generateRepository,
	generateRepositoryDetailed,
} from "../__mocks__/mocks";

describe("RepositoryRepositoryService", () => {
	let service: RepositoryRepositoryService;
	let repositoryBasicRepository: jest.Mocked<RepositoryBasicRepository>;
	let repositoryDetailedRepository: jest.Mocked<RepositoryDetailedRepository>;
	let userService: jest.Mocked<UserService>;
	let authenticator: Authenticator;
	let validator: Validator<unknown>;
	let repository: RepositoryBasic;
	let repositoryDetailed: RepositoryDetailed;
	let repositories: RepositoryBasic[];
	let repositoriesDetailed: RepositoryDetailed[];
	let comment: Comment;
	let pullRequest: PullRequest;
	let contributor: ContributorDetailed;

	beforeEach(() => {
		repositoryBasicRepository = mock<RepositoryBasicRepository>();
		repositoryDetailedRepository = mock<RepositoryDetailedRepository>();
		userService = mock<UserService>();
		authenticator = new MockAuthenticator("secret-key");
		validator = new MockValidator();

		service = new RepositoryRepositoryService({
			repositoryBasicRepository,
			repositoryDetailedRepository,
			userService,
			authenticator,
			validator,
			config: {
				repository: repositoryBasicRepository,
			},
		});

		// Register with ServiceLocator
		ServiceLocator.registerValidator("RepositoryValidator", validator);

		repository = generateRepository();
		repositoryDetailed = generateRepositoryDetailed();
		repositories = [repository, { ...repository, id: 2, name: "test-repo-2" }];
		repositoriesDetailed = [
			repositoryDetailed,
			{
				...repositoryDetailed,
				description: "Detailed Repository 2",
				name: "Detailed Repository",
			},
		];
		comment = generateComment();
		pullRequest = generatePullRequest();
		contributor = generateContributorDetailed();
	});

	describe("getById", () => {
		it("should return the repository", async () => {
			repositoryBasicRepository.getById.mockResolvedValue(repository);
			const result = await service.getById(1);
			expect(result).toEqual(repository);
		});

		it("should throw RepositoryNotFoundError if repository does not exist", async () => {
			repositoryBasicRepository.getById.mockResolvedValue(null);
			await expect(service.getById(1)).rejects.toThrow(RepositoryNotFoundError);
		});
	});

	describe("getByIdDetailed", () => {
		it("should return the detailed repository", async () => {
			repositoryDetailedRepository.getById.mockResolvedValue(
				repositoryDetailed,
			);
			const result = await service.getByIdDetailed(1);
			expect(result).toEqual(repositoryDetailed);
		});

		it("should throw RepositoryNotFoundError if repository does not exist", async () => {
			repositoryDetailedRepository.getById.mockResolvedValue(null);
			await expect(service.getByIdDetailed(1)).rejects.toThrow(
				RepositoryNotFoundError,
			);
		});
	});

	describe("getAll", () => {
		it("should return all repositories", async () => {
			repositoryBasicRepository.getAll.mockResolvedValue(repositories);
			const result = await service.getAll({});
			expect(result).toEqual(repositories);
		});
	});

	describe("getAllDetailed", () => {
		it("should return all detailed repositories when no filter is applied", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed,
			);
			const result = await service.getAllDetailed({});
			expect(result).toEqual(repositoriesDetailed);
		});

		it("should return all detailed repositories with pagination", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed.slice(1, 2),
			);

			const result = await service.getAllDetailed({
				take: 1,
				skip: 1,
			});

			expect(result).toEqual(repositoriesDetailed.slice(1, 2));
		});

		it("should return all detailed repositories with filtering by owner", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed,
			);
			const where: QueryOptions<RepositoryDetailed>["where"] = {
				id: 1,
			};
			const result = await service.getAllDetailed({
				where: {},
			});
			expect(result).toEqual(
				repositoriesDetailed.filter((repo) => {
					return repo.owner.username === "test-user";
				}),
			);
		});

		it("should return all detailed repositories with filtering by programming language", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed.filter((repo) => {
					return repo.programming_languages?.includes(
						ProgrammingLanguage.JAVASCRIPT,
					);
				}),
			);

			const result = await service.getAllDetailed({
				where: {
					programming_languages: [ProgrammingLanguage.JAVASCRIPT],
				},
			});

			expect(result).toEqual(
				repositoriesDetailed.filter((repo) => {
					return repo.programming_languages?.includes(
						ProgrammingLanguage.JAVASCRIPT,
					);
				}),
			);
		});

		it("should return all detailed repositories with filtering by number of stars", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed,
			);
			const result = await service.getAllDetailed({});
			expect(result).toEqual(
				repositoriesDetailed.sort((a, b) => {
					return b.stars.length - a.stars.length;
				}),
			);
		});

		it("should return all detailed repositories with filtering by created_at", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed,
			);
			const result = await service.getAllDetailed({
				where: {
					created_at: {
						greaterThan: new Date(2021, 1, 1),
					},
				},
			});
			expect(result).toEqual(
				repositoriesDetailed.sort(
					(a, b) => b.created_at.getTime() - a.created_at.getTime(),
				),
			);
		});

		it("should return all detailed repositories with filtering by updated_at", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed,
			);
			const result = await service.getAllDetailed({
				where: {
					updated_at: {
						greaterThan: new Date(2021, 1, 1),
					},
				},
			});
			expect(result).toEqual(
				repositoriesDetailed.sort(
					(a, b) => b.updated_at.getTime() - a.updated_at.getTime(),
				),
			);
		});

		it("should return all detailed repositories with filtering by description", async () => {
			// NOTE: This method relies on filtering done by the
			// repositoryDetailedRepository.getAll method.
			// TThe service.getAllDetailed method just returns the results
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed.filter((repo) => {
					return repo.description?.includes("test");
				}),
			);

			const result = await service.getAllDetailed({
				where: {
					description: {
						contains: "test",
					},
				},
			});
			expect(result).toEqual(
				repositoriesDetailed.filter((repo) => {
					return repo.description?.includes("test");
				}),
			);
		});

		it("should return all detailed repositories with filtering by name", async () => {
			// NOTE: This method relies on filtering done by the
			// repositoryDetailedRepository.getAll method.
			// TThe service.getAllDetailed method just returns the results
			repositoryDetailedRepository.getAll.mockResolvedValue(
				repositoriesDetailed.filter((repo) =>
					repo.name?.toLowerCase().includes("test"),
				),
			);

			const result = await service.getAllDetailed({
				where: {
					name: {
						contains: "test",
					},
				},
			});

			expect(result).toEqual(
				repositoriesDetailed.filter((repo) =>
					repo.name?.toLowerCase().includes("test"),
				),
			);
		});
	});

	describe("create", () => {
		it("should create a new repository", async () => {
			const entityData: RepositoryBasic = {
				id: 1,
				name: "Test Repo",
				visibility: "public",
				owner_id: 1,
				created_at: new Date(),
				updated_at: new Date(),
				description: "Test Description",
			};
			const authToken = "valid-token";

			repositoryBasicRepository.create.mockResolvedValue(entityData);
			userService.checkUserExists.mockResolvedValue(true);

			const result = await service.create(entityData, authToken);

			expect(result).toEqual(entityData);
			expect(repositoryBasicRepository.create).toHaveBeenCalledWith(entityData);
		});

		it("should throw RepositoryAlreadyExistsError if repository already exists", async () => {
			const entityData = { name: "Test Repo", visibility: "public" };
			const authToken = "valid-token";
			const existingRepository: RepositoryBasic = {
				id: 1,
				created_at: new Date(),
				description: "Test Description",
				name: "Test Repo",
				owner_id: 1,
				updated_at: new Date(),
				visibility: "public",
			};

			userService.checkUserExists.mockResolvedValue(true);

			repositoryBasicRepository.findOne.mockResolvedValue(existingRepository);

			await expect(service.create(entityData, authToken)).rejects.toThrow(
				RepositoryAlreadyExistsError,
			);
		});

		it("should throw UserDoesNotExistError if owner does not exist", async () => {
			const entityData = { name: "Test Repo", visibility: "public" };
			const authToken = "valid-token";

			userService.checkUserExists.mockResolvedValue(false);

			await expect(service.create(entityData, authToken)).rejects.toThrow(
				UserDoesNotExistError,
			);
		});
	});

	describe("update", () => {
		const repository: RepositoryBasic = {
			id: 1,
			name: "Test Repo",
			visibility: "public",
			owner_id: 1,
			created_at: new Date(),
			updated_at: new Date(),
			description: "Test Description",
		};
		const updatedRepository: RepositoryBasic = {
			id: 1,
			name: "Updated Repo",
			visibility: "public",
			owner_id: 1,
			created_at: new Date(),
			updated_at: new Date(),
			description: "Test Description",
		};
		const detailedRepository: RepositoryDetailed = {
			...repository,
			...updatedRepository,
			contributors: [],
			issues: [],
			license: null,
			license_id: null,
			organization: null,
			organization_id: null,
			owner: {
				avatar: null,
				bio: null,
				created_at: new Date(),
				updated_at: new Date(),
				email: "test@test.com",
				name: "Test User",
				public_email: null,
				repositories: [],
				role: UserRole.USER,
				id: 1,
				username: "test-user",
				deleted: false,
				deleted_at: null,
				password: "password",
			},
			programming_languages: [],
			pull_requests: [],
			stars: [],
			tag: null,
			tag_id: null,
			created_at: new Date(),
			description: "Test Description",
			id: 1,
			name: "Updated Repo",
			owner_id: 1,
			updated_at: new Date(),
			visibility: "public",
		};

		it("should throw RepositoryNotFoundError if repository does not exist", async () => {
			repositoryBasicRepository.getById.mockResolvedValue(null);

			await expect(
				service.update(
					1,
					{
						name: "Updated Repo",
					},
					undefined,
					"auth-token",
				),
			).rejects.toThrow(RepositoryNotFoundError);
		});

		it("should update the repository", async () => {
			repositoryBasicRepository.getById.mockResolvedValue(repository);
			repositoryDetailedRepository.getById.mockResolvedValue(
				detailedRepository,
			);
			repositoryBasicRepository.update.mockResolvedValue(updatedRepository);
			userService.checkUserExists.mockResolvedValue(true);

			const result = await service.update(
				1,
				{
					name: "Updated Repo",
				},
				1,
				"auth-token",
			);

			expect(result).toEqual(updatedRepository);
			expect(repositoryBasicRepository.update).toHaveBeenCalledWith(1, {
				name: "Updated Repo",
			});
		});

		it("should throw UserDoesNotExistError if owner does not exist", async () => {
			// Arrange
			const repositoryId = 1;
			const entityData = { owner_id: 2 };
			const authToken = "valid-token";

			repositoryBasicRepository.getById.mockResolvedValue(repository);
			userService.checkUserExists.mockResolvedValue(false);

			// Act & Assert
			await expect(
				service.update(repositoryId, entityData, undefined, authToken),
			).rejects.toThrow(UserDoesNotExistError);
		});

		it("should throw RepositoryNotFoundError if repository does not exist", async () => {
			repositoryBasicRepository.getById.mockResolvedValue(null);
			await expect(
				service.update(
					1,
					{
						name: "Updated Repo",
					},
					1,
					"auth-token",
				),
			).rejects.toThrow(RepositoryNotFoundError);
		});
	});

	describe("delete", () => {
		const repository: RepositoryBasic = {
			id: 1,
			name: "Test Repo",
			visibility: "public",
			owner_id: 1,
			created_at: new Date(),
			updated_at: new Date(),
			description: "Test Description",
		};

		it("should delete the repository", async () => {
			repositoryBasicRepository.getById.mockResolvedValue(repository);
			repositoryBasicRepository.delete.mockResolvedValue();
			userService.checkUserExists.mockResolvedValue(true);
			const result = await service.delete(1, 1, "auth-token");
			expect(result).toBeUndefined();
			expect(repositoryBasicRepository.delete).toHaveBeenCalledWith(1);
		});

		it("should throw RepositoryNotFoundError if repository does not exist", async () => {
			repositoryBasicRepository.getById.mockResolvedValue(null);
			await expect(service.delete(1, 1, "auth-token")).rejects.toThrow(
				RepositoryNotFoundError,
			);
		});
	});
});
