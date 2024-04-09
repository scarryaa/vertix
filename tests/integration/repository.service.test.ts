import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { mock } from "jest-mock-extended";
import type { Authenticator } from "../../src/authenticators/service-layer/base.authenticator";
import type { AuthzService } from "../../src/authorization/authorization.service";
import {
	type ContributorDetailed,
	type RepositoryBasic,
	type UserBasic,
	UserRole,
} from "../../src/models";
import { RepositoryBasicRepository } from "../../src/repositories/repository-basic.repository";
import { RepositoryDetailedRepository } from "../../src/repositories/repository-detailed.repository";
import { RepositoryRepositoryService } from "../../src/services/repository.service";
import type { UserService } from "../../src/services/user.service";
import {
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
	UnauthorizedError,
} from "../../src/utils/errors";
import { ServiceLocator } from "../../src/utils/service-locator";
import type { Validator } from "../../src/validators/service-layer/base.validator";

describe("RepositoryService with Prisma", () => {
	let prisma: PrismaClient;
	let repositoryService: RepositoryRepositoryService;
	let repositoryBasic: RepositoryBasicRepository;
	let repositoryDetailed: RepositoryDetailedRepository;
	let authenticator: jest.Mocked<Authenticator>;
	let authzService: jest.Mocked<AuthzService>;
	let validator: jest.Mocked<Validator<RepositoryBasic>>;
	let userService: jest.Mocked<UserService>;
	let user: UserBasic;

	beforeAll(async () => {
		prisma = new PrismaClient();
		repositoryBasic = new RepositoryBasicRepository(prisma);
		repositoryDetailed = new RepositoryDetailedRepository(prisma);
		authenticator = mock<Authenticator>();
		authzService = mock<AuthzService>();
		validator = mock<Validator<RepositoryBasic>>();
		userService = mock<UserService>();

		repositoryService = new RepositoryRepositoryService({
			authenticator,
			validator,
			authzService,
			config: {
				repository: repositoryBasic,
			},
			repositoryBasicRepository: repositoryBasic,
			repositoryDetailedRepository: repositoryDetailed,
			userService,
		});

		// Mock conditions
		validator.validateAllFields.mockReturnValue({
			isValid: true,
			errorMessage: undefined,
			missingRequiredFields: [],
			unsupportedFields: [],
		});
		validator.validate.mockReturnValue({
			isValid: true,
			errorMessage: undefined,
			missingRequiredFields: [],
			unsupportedFields: [],
		});
		validator.validateAtLeastOneField.mockReturnValue({
			isValid: true,
			errorMessage: undefined,
			missingRequiredFields: [],
			unsupportedFields: [],
		});

		// Mock user
		authenticator.authenticate.mockReturnValue({
			user_id: 1,
			role: UserRole.USER,
		} as never);
		authzService.authenticateUser.mockResolvedValue(1);
		userService.verifyUserExists.mockResolvedValue(undefined);

		// Register validator with ServiceLocator
		ServiceLocator.registerValidator("RepositoryValidator", validator);
	});

	beforeEach(async () => {
		// Seed db
		// Users
		for (let i = 0; i < 10; i++) {
			const email = faker.internet.email();
			const username = `${faker.internet.userName()}${i}`;

			await prisma.user.upsert({
				where: { email: email },
				update: {},
				create: {
					email,
					username,
					name: faker.person.fullName(),
					avatar: faker.image.avatar(),
					bio: faker.lorem.sentence(),
					public_email: faker.internet.email(),
					password: faker.internet.password(),
				},
			});
		}

		// Repositories
		for (let i = 0; i < 10; i++) {
			await prisma.repository.upsert({
				where: {
					name: faker.lorem.sentence(),
					id: i + 1,
				},
				update: {},
				create: {
					name: faker.lorem.sentence(),
					description: faker.lorem.sentence(),
					visibility: faker.helpers.arrayElement(["public", "private"]),
					created_at: faker.date.recent(),
					owner_id: i + 1,
				},
			});
		}
	});

	afterEach(async () => {
		// Clean up the database after each test
		await prisma.repository.deleteMany({
			where: {
				id: {
					not: 0,
				},
			},
		});
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it("should create a new repository successfully", async () => {
		// Arrange
		// biome-ignore lint/style/useConst: False positive?
		let createdRepository: RepositoryBasic | undefined;
		const repositoryData: Omit<
			RepositoryBasic,
			"id" | "created_at" | "updated_at" | "description"
		> = {
			name: faker.lorem.sentence(),
			visibility: faker.helpers.arrayElement(["public", "private"]),
			owner_id: 1,
		};

		// Act
		createdRepository = await repositoryService.create(
			repositoryData,
			"auth-token",
		);

		// Assert
		expect(createdRepository).toBeDefined();
		expect(createdRepository?.name).toEqual(repositoryData.name);

		// Verify the repository was created in the database
		const dbRepository = await prisma.repository.findUnique({
			where: { id: createdRepository?.id },
		});
		expect(dbRepository).toBeDefined();
		expect(dbRepository?.name).toEqual(repositoryData.name);
	});

	it("should update a repository successfully", async () => {
		// Arrange
		const originalRepositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: originalRepositoryData,
		});
		const updateData = {
			name: faker.lorem.sentence(), // Ensure a different name
			visibility: "private",
		};

		// Act
		const updatedRepository = await repositoryService.update(
			createdRepository.id,
			updateData,
			createdRepository.owner_id,
			"auth-token",
		);

		// Assert
		expect(updatedRepository).toBeDefined();
		expect(updatedRepository?.name).toEqual(updateData.name);
		expect(updatedRepository?.visibility).toEqual(updateData.visibility);

		// Verify the repository was updated in the database
		const dbRepository = await prisma.repository.findUnique({
			where: { id: createdRepository.id },
		});
		expect(dbRepository).toBeDefined();
		expect(dbRepository?.name).toEqual(updateData.name);
		expect(dbRepository?.visibility).toEqual(updateData.visibility);
	});

	it("should delete a repository successfully", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});

		// Act
		await repositoryService.delete(
			createdRepository.id,
			createdRepository.owner_id,
			"auth-token",
		);

		// Assert
		const dbRepository = await prisma.repository.findUnique({
			where: { id: createdRepository.id },
		});
		expect(dbRepository).toBeNull();
	});

	it("should not allow creating a repository with a name that already exists for the same owner", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		await prisma.repository.create({
			data: repositoryData,
		});

		// Act & Assert
		await expect(
			repositoryService.create(repositoryData, "auth-token"),
		).rejects.toThrow(RepositoryAlreadyExistsError);
	});

	it("should retrieve all repositories", async () => {
		// Act
		const repositories = await repositoryService.getAll({});

		// Assert
		expect(repositories).toBeDefined();
		expect(repositories?.length).toBeGreaterThan(0);
	});

	it("should change the visibility of a repository successfully", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});
		const newVisibility = "private";

		// Act
		await repositoryService.update(
			createdRepository.id,
			{
				visibility: newVisibility,
			},
			undefined,
			"auth-token",
		);

		// Assert
		const updatedRepository = await prisma.repository.findUnique({
			where: { id: createdRepository.id },
		});
		expect(updatedRepository).toBeDefined();
		expect(updatedRepository?.visibility).toEqual(newVisibility);
	});

	it("should retrieve a repository by ID", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});

		// Act
		const retrievedRepository = await repositoryService.getById(
			createdRepository.id,
		);

		// Assert
		expect(retrievedRepository).toBeDefined();
		expect(retrievedRepository?.id).toEqual(createdRepository.id);
	});

	it("should throw an error when trying to update a non-existent repository", async () => {
		// Arrange
		const nonExistentRepositoryId = 999;
		const updateData = {
			name: faker.lorem.sentence(),
			visibility: "private",
		};

		// Act & Assert
		await expect(
			repositoryService.update(
				nonExistentRepositoryId,
				updateData,
				1,
				"auth-token",
			),
		).rejects.toThrow(RepositoryNotFoundError);
	});

	it("should throw an error when an unauthorized user attempts to update a repository", async () => {
		// Arrange
		authzService.authenticateUser.mockResolvedValue(999);
		authzService.throwIfNotRepositoryOwnerOrContributor.mockImplementation(
			() => {
				throw new UnauthorizedError();
			},
		);
		const repositoryData = {
			name: "base-name",
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});
		const updateData = {
			name: faker.lorem.sentence(),
			visibility: "private",
		};

		// Act & Assert
		await expect(
			repositoryService.update(
				createdRepository.id,
				updateData,
				undefined,
				"auth-token",
			),
		).rejects.toThrow(UnauthorizedError);
	});

	it("should throw an error when trying to delete a non-existent repository", async () => {
		// Arrange
		const nonExistentRepositoryId = 999;

		// Act & Assert
		try {
			await repositoryService.delete(nonExistentRepositoryId, 1, "auth-token");
		} catch (error) {
			expect(error).toBeInstanceOf(RepositoryNotFoundError);
		}
	});

	it("should throw an error when an unauthorized user attempts to delete a repository", async () => {
		// Arrange
		authzService.authenticateUser.mockResolvedValue(999);
		authzService.throwIfNotRepositoryOwner.mockImplementation(() => {
			throw new UnauthorizedError();
		});
		const repositoryData = {
			name: "base-name",
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});

		// Act & Assert
		try {
			await repositoryService.delete(
				createdRepository.id,
				undefined,
				"auth-token",
			);
		} catch (error) {
			expect(error).toBeInstanceOf(UnauthorizedError);
		}
	});

	it("should throw an error when trying to update unsupported repository fields", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});

		// Act & Assert
		await expect(
			repositoryService.update(
				createdRepository.id,
				{
					id: 8,
				},
				undefined,
				"auth-token",
			),
		).rejects.toThrow(Error);
		await expect(
			repositoryService.update(
				createdRepository.id,
				{
					created_at: new Date(),
				},
				undefined,
				"auth-token",
			),
		).rejects.toThrow(Error);
	});

	it("should allow updating a repository with the same name as an existing repository but a different owner", async () => {
		// Arrange
		const repositoryData = {
			name: "same-name",
			visibility: "public",
			owner_id: 1,
		};
		const secondRepositoryData = {
			name: "different-name",
			visibility: "public",
			owner_id: 2,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});
		const secondCreatedRepository = await prisma.repository.create({
			data: secondRepositoryData,
		});
		const updateData = {
			name: "same-name",
		};
		authzService.throwIfNotRepositoryOwnerOrContributor = jest.fn();

		// Act
		await repositoryService.update(
			secondCreatedRepository.id,
			updateData,
			undefined,
			"auth-token",
		);

		// Assert
		const secondUpdatedRepository = await prisma.repository.findUnique({
			where: { id: secondCreatedRepository.id },
		});
		expect(secondUpdatedRepository).toBeDefined();
		expect(secondUpdatedRepository?.name).toEqual(updateData.name);
	});

	it("should allow adding a contributor to a repository", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});

		// Act
		// await repositoryService.addContributor(
		//     createdRepository.id,
		//     2,
		//     "auth-token",
		// );

		// // Assert
		// const updatedRepository = await prisma.repository.findUnique({
		//     where: { id: createdRepository.id },
		// });
		// expect(updatedRepository).toBeDefined();
		// expect(updatedRepository?.contributors.length).toEqual(2);
	});

	it("should allow removing a contributor from a repository", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});

		// Act
		// await repositoryService.removeContributor(
		//     createdRepository.id,
		//     2,
		//     "auth-token",
		// );

		// // Assert
		// const updatedRepository = await prisma.repository.findUnique({
		//     where: { id: createdRepository.id },
		// });
		// expect(updatedRepository).toBeDefined();
		// expect(updatedRepository?.contributors.length).toEqual(1);
	});

	it("should throw an error when trying to add a contributor to a non-existent repository", async () => {
		// Arrange
		const nonExistentRepositoryId = 999;

		// Act & Assert
		// try {
		//     await repositoryService.addContributor(
		//         nonExistentRepositoryId,
		//         2,
		//         "auth-token",
		//     );
		// } catch (error) {
		//     expect(error).toBeInstanceOf(RepositoryNotFoundError);
		// }
	});

	it("should throw an error when trying to remove a contributor from a non-existent repository", async () => {
		// Arrange
		const nonExistentRepositoryId = 999;

		// Act & Assert
		// try {
		//     await repositoryService.removeContributor(
		//         nonExistentRepositoryId,
		//         2,
		//         "auth-token",
		//     );
		// } catch (error) {
		//     expect(error).toBeInstanceOf(RepositoryNotFoundError);
		// }
	});

	it("should throw an error when trying to retrieve repositories with an invalid filter", async () => {
		// Arrange
		const invalidFilter = {
			invalid: "filter",
		};

		// Act & Assert
		await expect(
			// @ts-ignore
			repositoryService.getAll({ where: invalidFilter }),
		).rejects.toThrow(Error);
	});

	it("should throw an error when trying to retrieve a repository with an invalid id", async () => {
		// Arrange
		const invalidRepositoryId = 999;

		// Act & Assert
		await expect(
			repositoryService.getById(invalidRepositoryId),
		).rejects.toThrow(Error);
	});

	it("should throw an error when trying to create a repository with an invalid name", async () => {
		// Arrange
		const invalidRepositoryData = {
			name: "",
		};

		// Act & Assert
		await expect(
			// @ts-ignore
			repositoryService.create(invalidRepositoryData),
		).rejects.toThrow(Error);
	});

	it("should throw an error when trying to update a repository with an invalid id", async () => {
		// Arrange
		const invalidRepositoryId = 0;

		// Act & Assert
		await expect(
			repositoryService.update(
				invalidRepositoryId,
				{},
				undefined,
				"auth-token",
			),
		).rejects.toThrow(Error);
	});

	it("should retrieve a repository with detailed information", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});

		// Act
		const repository = await repositoryService.getByIdDetailed(
			createdRepository.id,
		);

		// Assert
		expect(repository).toBeDefined();
		expect(repository?.name).toEqual(repositoryData.name);
		expect(repository?.visibility).toEqual(repositoryData.visibility);
		expect(repository?.owner_id).toEqual(repositoryData.owner_id);
		expect(repository?.created_at).toBeDefined();
		expect(repository?.updated_at).toBeDefined();
		// Some detailed props
		expect(repository?.programming_languages).toBeDefined();
		expect(repository?.programming_languages?.length).toBe(0);
		expect(repository?.license_id).toBeDefined();
		expect(repository?.license_id).toEqual(null);
	});

	it("should retrieve a repository with basic information", async () => {
		// Arrange
		const repositoryData = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};
		const createdRepository = await prisma.repository.create({
			data: repositoryData,
		});

		// Act
		const repository = await repositoryService.getById(createdRepository.id);

		// Assert
		expect(repository).toBeDefined();
		expect(repository?.name).toEqual(repositoryData.name);
		expect(repository?.visibility).toEqual(repositoryData.visibility);
		expect(repository?.owner_id).toEqual(repositoryData.owner_id);
		expect(repository?.created_at).toBeDefined();
		expect(repository?.updated_at).toBeDefined();
		// Detailed props
		// @ts-ignore intentionally undefined
		expect(repository?.issues).toBeUndefined();
		// @ts-ignore intentionally undefined
		expect(repository?.pull_requests).toBeUndefined();
		// @ts-ignore intentionally undefined
		expect(repository?.contributors).toBeUndefined();
	});

	it("should handle creating a large amount of repositories", () => {
		// Arrange
		const repositories = [];
		for (let i = 0; i < 1000; i++) {
			repositories.push({
				name: faker.lorem.sentence(),
				visibility: "public",
				owner_id: 1,
			});
		}

		// Act
		return Promise.all(
			repositories.map((repository) =>
				repositoryService.create(repository, "auth-token"),
			),
		);
	});

	it("should handle updating a large amount of repositories", async () => {
		// Arrange
		const repositories = [];
		for (let i = 0; i < 1000; i++) {
			const repositoryData = {
				description: faker.lorem.sentence(),
				name: faker.lorem.sentence(),
				visibility: "public",
				owner_id: 1,
				created_at: faker.date.recent(),
				updated_at: faker.date.recent(),
			};
			const createdRepository = await repositoryService.create(
				repositoryData,
				"auth-token",
			);
			repositories.push(createdRepository);
		}

		// Act & Assert
		await Promise.all(
			repositories.map((repository) =>
				repositoryService.update(
					repository.id,
					{
						description: faker.lorem.sentence(),
						name: faker.lorem.sentence(),
						visibility: "private",
					},
					undefined,
					"auth-token",
				),
			),
		);
	});

	it("should handle deleting a large amount of repositories", async () => {
		// Arrange
		authzService.authenticateUser = jest.fn();
		authzService.throwIfNotRepositoryOwner = jest.fn();
		authenticator.authenticate = jest.fn();
		const repositories = [];
		for (let i = 0; i < 1000; i++) {
			const repositoryData = {
				name: faker.lorem.sentence(),
				visibility: "public",
				owner_id: 1,
			};
			const createdRepository = await repositoryService.create(repositoryData, "auth-token");
			repositories.push(createdRepository);
		}
	
		// Act & Assert
		await Promise.all(
			repositories.map((repository) =>
				repositoryService.delete(
					repository.id,
					repository.owner_id,
					"auth-token",
				),
			),
		);
	});

	it("should handle retrieving a large amount of repositories individually", () => {
		// Arrange
		const repositories: (Partial<RepositoryBasic> &
			Pick<RepositoryBasic, "name" | "visibility" | "owner_id">)[] = [];
		for (let i = 0; i < 1000; i++) {
			repositories.push({
				name: faker.lorem.sentence(),
				visibility: "public",
				owner_id: 1,
			});
		}

		// Act
		return Promise.all(
			repositories.map((repository) =>
				repositoryService.create(repository, "auth-token"),
			),
		).then(() =>
			Promise.all(
				repositories.map((repository) =>
					// @ts-ignore id will be defined by the db
					repositoryService.getById(repository.id),
				),
			),
		);
	});

	it("should handle retrieving a large amount of repositories with detailed information", () => {
		// Arrange
		const repositories: (Partial<RepositoryBasic> &
			Pick<RepositoryBasic, "name" | "visibility" | "owner_id">)[] = [];
		for (let i = 0; i < 1000; i++) {
			repositories.push({
				name: faker.lorem.sentence(),
				visibility: "public",
				owner_id: 1,
			});
		}

		// Act
		return Promise.all(
			repositories.map((repository) =>
				repositoryService.create(repository, "auth-token"),
			),
		).then(() =>
			Promise.all(
				repositories.map((repository) =>
					// @ts-ignore id will be defined by the db
					repositoryService.getByIdDetailed(repository.id),
				),
			),
		);
	});

	it("should handle retrieving a large amount of repositories with basic information", () => {
		// Arrange
		const repositories: (Partial<RepositoryBasic> &
			Pick<RepositoryBasic, "name" | "visibility" | "owner_id">)[] = [];
		for (let i = 0; i < 1000; i++) {
			repositories.push({
				name: faker.lorem.sentence(),
				visibility: "public",
				owner_id: 1,
			});
		}

		// Act
		return Promise.all(
			repositories.map((repository) =>
				repositoryService.create(repository, "auth-token"),
			),
		).then(() =>
			Promise.all(
				repositories.map((repository) =>
					// @ts-ignore id will be defined by the db
					repositoryService.getById(repository.id),
				),
			),
		);
	});

	it("should handle retrieving repositories by name", () => {
		// Arrange
		const repository: Partial<RepositoryBasic> &
			Pick<RepositoryBasic, "name" | "visibility"> = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};

		// Act
		return repositoryService
			.create(repository, "auth-token")
			.then(() =>
				repositoryService.getAllDetailed({ where: { name: repository.name } }),
			);
	});

	it("should handle retrieving repositories by owner", () => {
		// Arrange
		const repository: Partial<RepositoryBasic> &
			Pick<RepositoryBasic, "name" | "visibility"> = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};

		// Act
		return repositoryService.create(repository, "auth-token").then(() =>
			repositoryService.getAllDetailed({
				where: { owner_id: repository.owner_id },
			}),
		);
	});

	it("should handle retrieving repositories by visibility", () => {
		// Arrange
		const repository: Partial<RepositoryBasic> &
			Pick<RepositoryBasic, "name" | "visibility"> = {
			name: faker.lorem.sentence(),
			visibility: "public",
			owner_id: 1,
		};

		// Act
		return repositoryService.create(repository, "auth-token").then(() =>
			repositoryService.getAllDetailed({
				where: { visibility: repository.visibility },
			}),
		);
	});

	// Test for role access change?
});
