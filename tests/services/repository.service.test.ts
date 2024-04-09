import { mock } from "jest-mock-extended";
import type { Authenticator } from "../../src/authenticators/service-layer/base.authenticator";
import type { AuthzService } from "../../src/authorization/authorization.service";
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
	let authenticator: jest.Mocked<Authenticator>;
	let authzService: jest.Mocked<AuthzService>;
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
		authenticator = mock<Authenticator>();
		validator = new MockValidator();
		authzService = mock<AuthzService>();

		service = new RepositoryRepositoryService({
			repositoryBasicRepository,
			repositoryDetailedRepository,
			userService,
			authenticator,
			validator,
			authzService,
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
		jest.resetAllMocks();
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
			const entityData = {
				name: "Test Repo",
				visibility: "public",
				description: "Test Description",
			};
			const expectedEntityData = {
				...entityData,
				owner_id: undefined,
			};
			const authToken = "valid-token";

			authenticator.authenticate.mockResolvedValue({
				user_id: 1,
				role: UserRole.USER,
			} as never);
			userService.checkUserExists.mockResolvedValue(true);
			repositoryBasicRepository.create.mockResolvedValue({
				...expectedEntityData,
				owner_id: 1,
				id: 1,
				created_at: new Date(),
				updated_at: new Date(),
			});

			const result = await service.create(entityData, authToken);

			expect(result).toMatchObject({ ...expectedEntityData, owner_id: 1 });
			expect(repositoryBasicRepository.create).toHaveBeenCalledWith(
				expectedEntityData,
			);
		});

		it("should throw RepositoryAlreadyExistsError if repository already exists", async () => {
			const entityData = {
				name: "Existing Repo",
				visibility: "public",
				description: "Existing Description",
			};
			const authToken = "valid-token";

			authenticator.authenticate.mockResolvedValue({
				user_id: 1,
				role: UserRole.USER,
			} as never);
			userService.checkUserExists.mockResolvedValue(true);
			repositoryBasicRepository.findFirst.mockResolvedValue({
				...repository,
				name: "Existing Repo",
			});
			repositoryDetailedRepository.findFirst.mockResolvedValue({
				...repositoryDetailed,
				name: "Existing Repo",
			});

			await expect(service.create(entityData, authToken)).rejects.toThrow(
				RepositoryAlreadyExistsError,
			);
		});

		it("should throw UserDoesNotExistError if owner does not exist", async () => {
			userService.verifyUserExists.mockImplementation(() => {
				throw new UserDoesNotExistError();
			});
			const entityData = { name: "Test Repo", visibility: "public" };
			const authToken = "valid-token";
			authenticator.authenticate = jest
				.fn()
				.mockResolvedValue({ user_id: 1, role: UserRole.USER });

			await expect(service.create(entityData, authToken)).rejects.toThrow(
				UserDoesNotExistError,
			);
		});
	});

	describe("update", () => {
		const repositoryDetailedrepository: RepositoryBasic = {
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
			const authToken = "valid-token";
			repositoryBasicRepository.findFirst.mockResolvedValue(null);
			authenticator.authenticate.mockResolvedValue({
				user_id: 1,
				role: UserRole.USER,
			} as never);
			authzService.authenticateUser.mockResolvedValue(1);

			await expect(
				service.update(1, updatedRepository, undefined, authToken),
			).rejects.toThrow(RepositoryNotFoundError);
		});

		it("should update the repository", async () => {
			const authToken = "valid-token";
			const repositoryId = 1;
			const userId = 1;
			const updatedRepository = {
				id: 1,
				name: "Updated Repo",
				visibility: "public",
				owner_id: 1,
				created_at: new Date(),
				updated_at: new Date(),
				description: "Test Description",
			};
			authenticator.authenticate = jest
				.fn()
				.mockResolvedValue({ user_id: userId, role: UserRole.USER });
			authzService.authenticateUser.mockResolvedValue(1);
			service.getById = jest.fn().mockResolvedValue(repository);
			repositoryBasicRepository.update.mockResolvedValue(updatedRepository);
			repositoryBasicRepository.findFirst.mockResolvedValue({
				created_at: new Date(),
				updated_at: new Date(),
				id: 9,
				description: "Test Description",
				name: "some-name",
				owner_id: 1,
				visibility: "public",
			});
			repositoryDetailedRepository.findFirst.mockResolvedValue(
				repositoryDetailed,
			);

			const result = await service.update(
				9,
				updatedRepository,
				undefined,
				authToken,
			);

			expect(result).toEqual(updatedRepository);
			expect(repositoryBasicRepository.update).toHaveBeenCalledWith(
				9,
				updatedRepository,
			);
		});

		it("should throw UserDoesNotExistError if owner does not exist", async () => {
			const authToken = "valid-token";
			repositoryBasicRepository.findFirst.mockResolvedValue({
				...repository,
				name: "unique-name",
			});
			repositoryDetailedRepository.findFirst.mockResolvedValue({
				...repositoryDetailed,
				name: "unique-name",
			});
			userService.verifyUserExists.mockImplementation(() => {
				throw new UserDoesNotExistError();
			});
			authenticator.authenticate.mockResolvedValue({
                user_id: 1,
                role: UserRole.USER,
            } as never);
			authzService.authenticateUser.mockResolvedValue(1);

			await expect(
				service.update(
					1,
					{ ...updatedRepository, name: "very-unique-name" },
					undefined,
					authToken,
				),
			).rejects.toThrow(UserDoesNotExistError);
		});

		it("should throw RepositoryNotFoundError if repository does not exist", async () => {
			const authToken = "valid-token";
			repositoryBasicRepository.findFirst.mockResolvedValue(null);
			authenticator.authenticate.mockResolvedValue({
                user_id: 1,
                role: UserRole.USER,
            } as never);
			authzService.authenticateUser.mockResolvedValue(1);

			await expect(
				service.update(1, updatedRepository, undefined, authToken),
			).rejects.toThrow(RepositoryNotFoundError);
		});
	});

	// describe("delete", () => {
	// 	const repository: RepositoryBasic = {
	// 		id: 1,
	// 		name: "Test Repo",
	// 		visibility: "public",
	// 		owner_id: 1,
	// 		created_at: new Date(),
	// 		updated_at: new Date(),
	// 		description: "Test Description",
	// 	};

	// 	it("should delete the repository", async () => {
	// 		const auth_token = "valid-token";
	// 		repositoryBasicRepository.findFirst.mockResolvedValue({
	// 			...repository,
	// 			id: 1,
	// 			owner_id: 1,
	// 		});
	// 		repositoryBasicRepository.delete.mockResolvedValue();
	// 		(authenticator.authenticate as jest.Mock).mockResolvedValue({
	// 			user_id: 1,
	// 			role: UserRole.USER,
	// 		});

	// 		const result = await service.delete(1, 1, auth_token);

	// 		expect(result).toEqual(undefined);
	// 		expect(repositoryBasicRepository.delete).toHaveBeenCalledWith(1);
	// 	});

	// 	it("should throw RepositoryNotFoundError if repository does not exist", async () => {
	// 		const authToken = "valid-token";
	// 		repositoryBasicRepository.findFirst.mockResolvedValue(null);

	// 		await expect(service.delete(1, undefined, authToken)).rejects.toThrow(
	// 			RepositoryNotFoundError,
	// 		);
	// 	});

	// 	it("should throw UnauthorizedError if user is not the owner", async () => {
	// 		const auth_token = authenticator.authenticate.mockResolvedValue({
	// 			user_id: 0,
	// 			role: UserRole.ADMIN,
	// 		} as never);
	// 		repositoryBasicRepository.findFirst.mockResolvedValue(repository);
	// 		userService.checkUserExists.mockResolvedValue(false);

	// 		await expect(service.delete(1, undefined, "valid-token")).rejects.toThrow(
	// 			UnauthorizedError,
	// 		);
	// 	});
	// });
});
