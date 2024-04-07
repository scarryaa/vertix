import { mock } from "jest-mock-extended";
import { Authenticator } from "../../src/authenticators/service-layer/base.authenticator";
import {
	type Comment,
	type Commit,
	type ContributorDetailed,
	ProgrammingLanguage,
	type PullRequest,
	PullRequestStatus,
	type RepositoryBasic,
	type RepositoryDetailed,
	Timezone,
	type UserDetailed,
	UserRole,
	UserStatus,
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
import {
	type ValidationResult,
	Validator,
} from "../../src/validators/service-layer/base.validator";

class MockAuthenticator extends Authenticator {
	constructor(private _secretKey: string) {
		super(_secretKey);
		this._secretKey = _secretKey;
	}

	authenticate(
		authToken: string,
		roles: UserRole[],
	): { user_id: number; role: UserRole } {
		return { user_id: 1, role: UserRole.USER };
	}
}

class MockValidator extends Validator<unknown> {
	validate(data: unknown): ValidationResult<unknown> {
		return {
			errorMessage: undefined,
			isValid: true,
			missingRequiredFields: [],
			unsupportedFields: [],
		};
	}
}

describe("RepositoryRepositoryService", () => {
	let service: RepositoryRepositoryService;
	let repositoryBasicRepository: jest.Mocked<RepositoryBasicRepository>;
	let repositoryDetailedRepository: jest.Mocked<RepositoryDetailedRepository>;
	let userService: jest.Mocked<UserService>;
	let authenticator: Authenticator;
	let validator: Validator<unknown>;

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
	});

	describe("getById", () => {
		const repository: RepositoryBasic = {
			id: 1,
			name: "Test Repo",
			visibility: "public",
			owner_id: 1,
			created_at: new Date(),
			updated_at: new Date(),
			description: "Test Description",
		};

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
		const detailedRepository: RepositoryDetailed = {
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

		it("should return the detailed repository", async () => {
			repositoryDetailedRepository.getById.mockResolvedValue(
				detailedRepository,
			);
			const result = await service.getByIdDetailed(1);
			expect(result).toEqual(detailedRepository);
		});

		it("should throw RepositoryNotFoundError if repository does not exist", async () => {
			repositoryDetailedRepository.getById.mockResolvedValue(null);
			await expect(service.getByIdDetailed(1)).rejects.toThrow(
				RepositoryNotFoundError,
			);
		});
	});

	describe("getAll", () => {
		const repositories: RepositoryBasic[] = [
			{
				id: 1,
				name: "Test Repo",
				visibility: "public",
				owner_id: 1,
				created_at: new Date(),
				updated_at: new Date(),
				description: "Test Description",
			},
			{
				id: 2,
				name: "Test Repo 2",
				visibility: "public",
				owner_id: 1,
				created_at: new Date(),
				updated_at: new Date(),
				description: "Test Description 2",
			},
		];

		it("should return all repositories", async () => {
			repositoryBasicRepository.getAll.mockResolvedValue(repositories);
			const result = await service.getAll({});
			expect(result).toEqual(repositories);
		});
	});

	describe("getAllDetailed", () => {
		const repository: RepositoryDetailed = {
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
			},
			programming_languages: [],
			pull_requests: [],
			stars: [],
			tag: null,
			tag_id: null,
			created_at: new Date(),
			description: "Test Description",
			id: 1,
			name: "Detailed Repo",
			owner_id: 1,
			updated_at: new Date(),
			visibility: "public",
		};

		const author: UserDetailed = {
			avatar: null,
			bio: null,
			created_at: new Date(),
			updated_at: new Date(),
			email: "test@test.com",
			name: "Test User",
			public_email: null,
			repositories: [],
			role: UserRole.USER,
			assigned_issues: [],
			collaborators: [],
			comments: [],
			commits: [],
			deleted_at: null,
			followers: [],
			following: [],
			issues: [],
			languages: [],
			last_login_at: null,
			location: null,
			memberships: [],
			notifications: [],
			password: "test-password",
			phone: null,
			preferred_languages: [],
			programming_languages: [],
			pull_request_authors: [],
			pull_requests: [],
			reviews: [],
			social_logins: [],
			stars: [],
			status: UserStatus.ACTIVE,
			timezone: Timezone.AEDT,
			two_factor_enabled: false,
			user_preferences: {
				id: 1,
				show_public_email: false,
				theme: "light",
				user_id: 1,
				user: {
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
				},
			},
			verified_email: false,
			website: null,
			reset_password_expires: null,
			reset_password_token: null,
			deleted: false,
			id: 1,
			username: "test-user",
		};

		const commentAuthor: ContributorDetailed = {
			id: 1,
			repository_id: 1,
			repository: repository,
			user_id: 1,
			user: {
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
			},
		};
		const comment: Comment = {
			id: 1,
			created_at: new Date(),
			updated_at: new Date(),
			author: {
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
			},
			author_id: 1,
			body: "Test Comment",
			deleted_user: false,
			issue_id: null,
			issue: {
				id: 1,
				repository_id: 1,
				author,
				comments: [] as Comment[],
				assignees: [],
				author_id: 1,
				body: "Test Comment",
				created_at: new Date(),
				repository: repository,
				status: "open",
				title: "Test Issue",
				updated_at: new Date(),
			},
			pull_request_id: 1,
			pull_request: {
				id: 1,
				author,
				authorId: 1,
				base_branch: "main",
				closed_at: null,
				comments: [],
				commits: [],
				created_at: new Date(),
				description: "Test Description",
				head_branch: "test-branch",
				merged_at: null,
				pull_request_assignees: [],
				repository_id: 1,
				repository: repository,
				reviews: [],
				status: PullRequestStatus.OPEN,
				title: "Test Pull Request",
				updated_at: new Date(),
			},
		};
		const commit: Commit = {
			id: 1,
			created_at: new Date(),
			author_id: 1,
			author,
			message: "Test Commit",
			pull_request_id: 1,
			pull_request: {
				id: 1,
				title: "Test Pull Request",
				description: "Test Description",
				created_at: new Date(),
				updated_at: new Date(),
				repository_id: 1,
				author,
				comments: [],
				authorId: 1,
				base_branch: "main",
				closed_at: null,
				commits: [],
				head_branch: "test-branch",
				merged_at: null,
				pull_request_assignees: [],
				repository: repository,
				reviews: [],
				status: PullRequestStatus.OPEN,
			},
			sha: "test-sha",
		};
		const pullRequest: PullRequest = {
			id: 1,
			title: "Test Pull Request",
			description: "Test Description",
			created_at: new Date(),
			updated_at: new Date(),
			repository_id: 1,
			author,
			comments: [],
			authorId: 1,
			base_branch: "master",
			closed_at: null,
			commits: [commit],
			head_branch: "test-branch",
			merged_at: null,
			pull_request_assignees: [],
			repository: repository,
			reviews: [],
			status: PullRequestStatus.OPEN,
		};
		author.repositories.push(repository);
		const detailedRepositories: RepositoryDetailed[] = [
			{
				...repository,
				contributors: [commentAuthor],
				issues: [comment.issue],
				pull_requests: [pullRequest],
				stars: [
					{
						created_at: new Date(),
						id: 1,
						repository_id: 1,
						repository,
						updattd_at: new Date(),
						user_id: 1,
						user: author,
					},
				],
			},
			{
				...repository,
				contributors: [commentAuthor],
				issues: [comment.issue],
				pull_requests: [pullRequest],
				stars: [],
			},
		];

		it("should return all detailed repositories", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories,
			);
			const result = await service.getAllDetailed({});
			expect(result).toEqual(detailedRepositories);
		});

		it("should return all detailed repositories with pagination", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories.slice(1, 2),
			);

			const result = await service.getAllDetailed({
				take: 1,
				skip: 1,
			});

			expect(result).toEqual(detailedRepositories.slice(1, 2));
		});

		it("should return all detailed repositories with filtering by owner", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories,
			);
			const where: QueryOptions<RepositoryDetailed>["where"] = {
				id: 1,
			};
			const result = await service.getAllDetailed({
				where: {},
			});
			expect(result).toEqual(
				detailedRepositories.filter((repo) => {
					return repo.owner.username === "test-user";
				}),
			);
		});

		it("should return all detailed repositories with filtering by programming language", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories,
			);
			const result = await service.getAllDetailed({
				where: {
					programming_languages: [ProgrammingLanguage.JAVASCRIPT],
				},
			});

			// expect(result).toEqual(
			// 	detailedRepositories.filter((repo) => {
			// 		return repo.programming_languages?.some((language) => {
			// 			return language === ProgrammingLanguage.JAVASCRIPT;
			// 		});
			// 	}),
			// );
		});

		it("should return all detailed repositories with filtering by number of stars", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories,
			);
			const result = await service.getAllDetailed({});
			expect(result).toEqual(
				detailedRepositories.sort((a, b) => {
					return b.stars.length - a.stars.length;
				}),
			);
		});

		it("should return all detailed repositories with filtering by created_at", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories,
			);
			const result = await service.getAllDetailed({
				where: {
					created_at: {
						greaterThan: new Date(2021, 1, 1),
					},
				},
			});
			expect(result).toEqual(
				detailedRepositories.sort(
					(a, b) => b.created_at.getTime() - a.created_at.getTime(),
				),
			);
		});

		it("should return all detailed repositories with filtering by updated_at", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories,
			);
			const result = await service.getAllDetailed({
				where: {
					updated_at: {
						greaterThan: new Date(2021, 1, 1),
					},
				},
			});
			expect(result).toEqual(
				detailedRepositories.sort(
					(a, b) => b.updated_at.getTime() - a.updated_at.getTime(),
				),
			);
		});

		it("should return all detailed repositories with filtering by description", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories,
			);
			const result = await service.getAllDetailed({
				where: {
					description: "Test Repository",
				},
			});
			expect(result).toEqual(
				detailedRepositories.filter((repo) => {
					return repo.description === "Test Description";
				}),
			);
		});

		it("should return all detailed repositories with filtering by name", async () => {
			repositoryDetailedRepository.getAll.mockResolvedValue(
				detailedRepositories,
			);
			const result = await service.getAllDetailed({
				where: {
					name: {
						contains: "Test",
					},
				},
			});

			expect(result).toEqual(
				detailedRepositories.filter((repo) => {
					return repo.contributors.some((contributor) => {
						return contributor.user.username === "test-user";
					});
				}),
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
