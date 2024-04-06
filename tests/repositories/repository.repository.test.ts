import type { Prisma, Repository } from "@prisma/client";
import { any } from "jest-mock-extended";
import { RepositoryBasicRepository } from "../../src/repositories/repository-basic.repository";
import {
	type Context,
	type MockContext,
	createMockContext,
} from "../__mocks__/mocks";

describe("RepositoryRepository", () => {
	let repositoryRepository: RepositoryBasicRepository;
	let mockContext: MockContext;
	let ctx: Context;

	beforeEach(() => {
		mockContext = createMockContext();
		ctx = mockContext as Context;

		repositoryRepository = new RepositoryBasicRepository(ctx.prisma);
	});

	afterEach(async () => {
		await ctx.prisma.repository.deleteMany();
		await ctx.prisma.user.deleteMany();
	});

	describe("findById", () => {
		it("should find a repository by id", async () => {
			mockContext.prisma.repository.findUnique.mockResolvedValueOnce({
				name: "Test Repository",
				description: "This is a test repository",
				visibility: "public",
				created_at: new Date(),
				updated_at: new Date(),
				license_id: null,
				organization_id: null,
				tag_id: null,
				id: 1,
				owner_id: 1,
				programming_languages: []
			});

			const foundRepository = await repositoryRepository.findById(1);

			// Assert the found repository
			expect(foundRepository).toEqual(
				expect.objectContaining({
					name: "Test Repository",
					description: "This is a test repository",
					visibility: "public",
					created_at: any(String),
					updated_at: any(String),
					license_id: null,
					organization_id: null,
					tag_id: null,
					id: 1,
					owner_id: 1,
					language: null,
				}),
			);

			expect(ctx.prisma.repository.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: {},
			});
		});

		it("should return undefined when repository by id not found", async () => {
			const foundRepository = await repositoryRepository.findById(1);
			expect(foundRepository).toBeUndefined();
		});
	});

	describe("findByOwner", () => {
		it("should find all by ownerId", async () => {
			const repositoriesToCreate: Prisma.RepositoryCreateManyInput[] = [
				{
					name: "repository-1",
					description: "This is the first repository",
					visibility: "public",
					owner_id: 1,
				},
				{
					name: "repository-2",
					description: "This is the second repository",
					visibility: "private",
					owner_id: 2,
				},
				{
					name: "repository-3",
					description: "This is the third repository",
					visibility: "public",
					owner_id: 1,
				},
			];

			await repositoryRepository.createMany(repositoriesToCreate);

			// get by owner
			const repositories = await repositoryRepository.findByOwnerId(1);
			expect(repositories).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: "repository-1",
						description: "This is the first repository",
						visibility: "public",
						owner_id: 1,
					}),
					expect.objectContaining({
						name: "repository-3",
						description: "This is the third repository",
						visibility: "public",
						owner_id: 1,
					}),
				]),
			);
		});
	});

	describe("findAll", () => {
		it("should return an empty array there are no repositories with given ownerId", async () => {
			const repositories = await repositoryRepository.findByOwnerId(1);
			expect(repositories).toBeInstanceOf(Array);
			expect(repositories).toHaveLength(0);
		});

		it("should get all repositories", async () => {
			// Define the repositories to create
			const repositoriesToCreate: Prisma.RepositoryCreateManyInput[] = [
				{
					name: "Repository 1",
					description: "This is the first repository",
					visibility: "public",
					owner_id: 1,
				},
				{
					name: "Repository 2",
					description: "This is the second repository",
					visibility: "private",
					owner_id: 2,
				},
				{
					name: "Repository 3",
					description: "This is the third repository",
					visibility: "public",
					owner_id: 1,
				},
			];

			// Create the repositories
			await repositoryRepository.createMany(repositoriesToCreate);

			// Get all repositories
			const { items: repositories, totalCount } =
				await repositoryRepository.findAll({});

			// Assert the repositories and total count
			expect(repositories.length).toBe(3);
			expect(totalCount).toBe(3);

			// Assert the repository data
			expect(repositories).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: "Repository 1",
						description: "This is the first repository",
						visibility: "public",
						owner_id: 1,
					}),
					expect.objectContaining({
						name: "Repository 2",
						description: "This is the second repository",
						visibility: "private",
						owner_id: 2,
					}),
					expect.objectContaining({
						name: "Repository 3",
						description: "This is the third repository",
						visibility: "public",
						owner_id: 1,
					}),
				]),
			);
		});

		it("should return an empty array when all repositories not found", async () => {
			const { items: foundRepositories, totalCount } =
				await repositoryRepository.findAll({});

			expect(foundRepositories).toEqual([]);
			expect(totalCount).toBe(0);
		});

		it("should return a valid array when 'where' is undefined", async () => {
			// Arrange
			const repositoryData: Prisma.RepositoryCreateManyInput[] = [
				{
					name: "Repository 1",
					description: "Test repository 1",
					visibility: "public",
					owner_id: 1,
				},
				{
					name: "Repository 2",
					description: "Test repository 2",
					visibility: "private",
					owner_id: 2,
				},
			];

			const numCreatedRepositories =
				await repositoryRepository.createMany(repositoryData);

			// Act
			const { items: repositories, totalCount } =
				await repositoryRepository.findAll({});

			// Assert
			expect(repositories).toHaveLength(numCreatedRepositories);
			expect(totalCount).toBe(numCreatedRepositories);
		});

		it("should return an empty array when 'where' doesn't match anything", async () => {
			// Arrange
			const repositoryData: Prisma.RepositoryCreateInput = {
				name: "Repository 1",
				description: "Test repository 1",
				visibility: "public",
				owner: {
					connect: {
						id: 1,
					},
				},
			};
			await repositoryRepository.create(repositoryData);

			// Act
			const { items: repositories, totalCount } =
				await repositoryRepository.findAll({
					ownerId: 999,
				});

			// Assert
			expect(repositories).toHaveLength(0);
			expect(totalCount).toBe(1);
		});

		it("should handle pagination correctly", async () => {
			// Arrange
			const repositoryData: Prisma.RepositoryCreateManyInput[] = [
				{
					name: "repository-1",
					description: "Test repository 1",
					visibility: "public",
					owner_id: 1,
				},
				{
					name: "repository-2",
					description: "Test repository 2",
					visibility: "private",
					owner_id: 1,
				},
				{
					name: "repository-3",
					description: "Test repository 3",
					visibility: "public",
					owner_id: 2,
				},
			];
			const createdRepositories =
				await repositoryRepository.createMany(repositoryData);

			// Act
			const limit = 2;
			const page = 1;
			const { items: repositories, totalCount } =
				await repositoryRepository.findAll({
					limit,
					page,
				});

			// Assert
			expect(repositories).toHaveLength(limit);
			expect(totalCount).toBe(repositoryData.length);
			expect(repositories[0]?.name).toBe("repository-1");
			expect(repositories[1]?.name).toBe("repository-2");
		});

		it("should handle 'skip' correctly", async () => {
			// Arrange
			const repositoryData = [
				{
					name: "Repository 1",
					description: "Test repository 1",
					visibility: "public",
					owner_id: 1,
				},
				{
					name: "Repository 2",
					description: "Test repository 2",
					visibility: "private",
					owner_id: 1,
				},
				{
					name: "Repository 3",
					description: "Test repository 3",
					visibility: "public",
					owner_id: 2,
				},
			];
			const createdRepositories =
				await repositoryRepository.createMany(repositoryData);

			// Act
			const { items: repositories, totalCount } =
				await repositoryRepository.findAll({
					skip: 1,
				});

			// Assert
			expect(repositories).toHaveLength(repositoryData.length - 1);
			expect(totalCount).toBe(repositoryData.length);
		});

		it("should calculate 'totalCount' correctly", async () => {
			// Arrange
			const repositoryData = [
				{
					name: "Repository 1",
					description: "Test repository 1",
					visibility: "public",
					owner_id: 1,
				},
				{
					name: "Repository 2",
					description: "Test repository 2",
					visibility: "private",
					owner_id: 2,
				},
			];
			const createdRepositories =
				await repositoryRepository.createMany(repositoryData);

			// Act
			const { totalCount } = await repositoryRepository.findAll({});

			// Assert
			expect(totalCount).toBe(repositoryData.length);
		});
	});

	describe("create", () => {
		it("should create a new repository", async () => {
			const newRepo = await repositoryRepository.create({
				name: "New Repository",
				description: "This is a new repository",
				visibility: "public",
				owner: {
					connect: {
						id: 1,
					},
				},
			});

			expect(newRepo).toEqual({
				id: 1,
				name: "New Repository",
				description: "This is a new repository",
				visibility: "public",
				owner: {
					connect: {
						id: 1,
					},
				},
			});
		});
	});

	describe("createMany", () => {
		it("should create multiple repositories", async () => {
			const repositoryData = [
				{
					name: "Repository 1",
					description: "Test repository 1",
					visibility: "public",
					owner_id: 1,
				},
				{
					name: "Repository 2",
					description: "Test repository 2",
					visibility: "private",
					owner_id: 1,
				},
				{
					name: "Repository 3",
					description: "Test repository 3",
					visibility: "public",
					owner_id: 2,
				},
			];

			const repoCount = await repositoryRepository.createMany(repositoryData);

			const createdRepositories = await repositoryRepository.findAll({});
			expect(createdRepositories).toEqual({
				totalCount: repositoryData.length,
				items: repositoryData.map((repo, index) => ({
					...repo,
					id: index + 1,
				})),
			});
		});
	});

	describe("update", () => {
		it("should update a repository", async () => {
			const repositoryBeforeUpdate = {
				name: "repository-1",
				description: "Test repository 1",
				visibility: "public",
				owner: {
					connect: {
						id: 1,
					},
				},
			};

			const repositoryAfterUpdate: Repository = {
				...repositoryBeforeUpdate,
				id: 1,
				name: "updated-repository",
				visibility: "private",
				created_at: new Date(),
				updated_at: new Date(),
				programming_languages: [],
				license_id: null,
				organization_id: null,
				owner_id: 1,
				tag_id: null,
				description: null
			};

			mockContext.prisma.repository.update.mockResolvedValueOnce(
				repositoryAfterUpdate,
			);

			const returnedRepositoryAfterUpdate = await repositoryRepository.update(
				1,
				{
					...repositoryBeforeUpdate,
					name: "updated-repository",
					visibility: "private",
				},
			);

			expect(returnedRepositoryAfterUpdate).toEqual({
				...repositoryAfterUpdate,
				id: 1,
			});
		});
	});

	it("should return an error when repository with given id does not exist", async () => {});
});

describe("delete", () => {
	it("should delete a repository", async () => {
		const repository: Prisma.RepositoryCreateInput = {
			name: "repo-1",
			description: "Test repository 1",
			visibility: "public",
			owner: {
				connect: {
					id: 1,
				},
			},
		};

		// // Create repo
		// const returnedRepository = await repositoryRepository.create(repository);

		// const deletedRepository = await repositoryRepository.delete({
		// 	where: { id: 1 },
		// });

		// expect(deletedRepository).toEqual(returnedRepository);
	});
});
