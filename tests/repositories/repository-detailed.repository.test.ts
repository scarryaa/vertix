import type { RepositoryBasic, RepositoryDetailed } from "../../src/models";
import { RepositoryDetailedRepository } from "../../src/repositories/repository-detailed.repository";
import {
	type Context,
	type MockContext,
	createMockContext,
	generateRepository,
	generateRepositoryDetailed,
} from "../__mocks__/mocks";

describe("RepositoryDetailedRepository", () => {
	let repositoryDetailedRepository: RepositoryDetailedRepository;
	let mockContext: MockContext;
	let ctx: Context;
	let repository: RepositoryBasic;
	let repositoryDetailed: RepositoryDetailed;
	let repositories: RepositoryBasic[];
	let repositoriesDetailed: RepositoryDetailed[];

	beforeEach(() => {
		mockContext = createMockContext();
		ctx = mockContext as Context;

		repositoryDetailedRepository = new RepositoryDetailedRepository(ctx.prisma);

		repository = generateRepository();
		repositoryDetailed = {
			...generateRepositoryDetailed(),
			programming_languages: [],
		};
		repositories = [repository, { ...repository, id: 2, name: "test-repo-2" }];
		repositoriesDetailed = [
			repositoryDetailed,
			{
				...repositoryDetailed,
				description: "Detailed Repository 2",
			},
			{
				...repositoryDetailed,
				description: "Detailed Repository 3",
				created_at: new Date("2020-01-01"),
			},
		];
	});

	afterEach(async () => {
		await ctx.prisma.repository.deleteMany();
		await ctx.prisma.user.deleteMany();
	});

	describe("create", () => {
		it("should create a new repository", async () => {
			mockContext.prisma.repository.create.mockResolvedValue({
				...repositoryDetailed,
				programming_languages: [],
			});
			const result = await repositoryDetailedRepository.create(repository);
			expect(result).toEqual({
				...repositoryDetailed,
				programming_languages: [],
			});
		});
	});

	describe("update", () => {
		it("should update an existing repository", async () => {
			mockContext.prisma.repository.update.mockResolvedValue(
				repositoryDetailed,
			);

			const result = await repositoryDetailedRepository.update(1, repository);
			expect(result).toEqual(repositoryDetailed);
		});
	});

	describe("delete", () => {
		it("should delete an existing repository", async () => {
			mockContext.prisma.repository.delete.mockResolvedValue(
				repositoryDetailed,
			);

			const result = await repositoryDetailedRepository.delete(repository.id);

			expect(result).toEqual(undefined);
		});
	});

	describe("getAll", () => {
		it("should get all repositories with no filtering", async () => {
			mockContext.prisma.repository.findMany.mockResolvedValue(
				repositoriesDetailed,
			);

			const result = await repositoryDetailedRepository.getAll({});

			expect(result).toEqual(repositoriesDetailed);
		});

		it("should get all repositories with filtering by name", async () => {
			mockContext.prisma.repository.findMany.mockResolvedValue(
				repositoriesDetailed,
			);

			const result = await repositoryDetailedRepository.getAll({
				where: { name: "test-repo" },
			});

			expect(result).toEqual(repositoriesDetailed);
			expect(mockContext.prisma.repository.findMany).toHaveBeenCalledWith({
				where: {
					name: "test-repo",
				},
			});
		});

		it("should get all repositories with filtering by owner id", async () => {
			mockContext.prisma.repository.findMany.mockResolvedValue(
				repositoriesDetailed,
			);

			const result = await repositoryDetailedRepository.getAll({
				where: { ownerId: 1 },
			});

			expect(result).toEqual(repositoriesDetailed);
			expect(mockContext.prisma.repository.findMany).toHaveBeenCalledWith({
				where: {
					ownerId: 1,
				},
			});
		});
	});

	it("should get all repositories with filtering by visibility", async () => {
		mockContext.prisma.repository.findMany.mockResolvedValue(
			repositoriesDetailed,
		);

		const result = await repositoryDetailedRepository.getAll({
			where: {
				visibility: "public",
			},
		});

		expect(result).toEqual(repositoriesDetailed);
		expect(mockContext.prisma.repository.findMany).toHaveBeenCalledWith({
			where: {
				visibility: "public",
			},
		});
	});

	it("should get all repositories with filtering by created_at date", async () => {
		mockContext.prisma.repository.findMany.mockResolvedValue(
			repositoriesDetailed,
		);

		const result = await repositoryDetailedRepository.getAll({
			where: {
				created_at: new Date("2020-01-01"),
			},
		});

		expect(result).toEqual(repositoriesDetailed);
		expect(mockContext.prisma.repository.findMany).toHaveBeenCalledWith({
			cursor: undefined,
			skip: undefined,
			take: undefined,
			where: {
				created_at: new Date("2020-01-01"),
			},
		});
	});
});
