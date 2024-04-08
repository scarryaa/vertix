import type { PrismaClient } from "@prisma/client";
import { any } from "jest-mock-extended";
import { PrismaRepository } from "../../src/repositories/base.repository";

const prismaMock = {
	user: {
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		findMany: jest.fn(),
		findFirst: jest.fn(),
	},
};

const model = "user";
const searchableFields = ["name", "email"];

describe("PrismaRepository", () => {
	// biome-ignore lint/suspicious/noExplicitAny: Needed for testing purposes
	let repository: PrismaRepository<any>;

	beforeEach(() => {
		repository = new PrismaRepository(
			prismaMock as unknown as PrismaClient,
			model,
			searchableFields,
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should create a new entity", async () => {
		const data = { name: "John Doe", email: "john@example.com" };
		const createdEntity = { id: 1, ...data };
		prismaMock.user.create.mockResolvedValueOnce(createdEntity);

		const result = await repository.create(data);

		expect(prismaMock.user.create).toHaveBeenCalledWith({ data });
		expect(result).toEqual(createdEntity);
	});

	it("should update an existing entity", async () => {
		const id = 1;
		const data = { name: "John Updated" };
		const updatedEntity = { id, ...data };
		prismaMock.user.update.mockResolvedValueOnce(updatedEntity);

		const result = await repository.update(id, data);

		expect(prismaMock.user.update).toHaveBeenCalledWith({
			where: { id },
			data,
		});
		expect(result).toEqual(updatedEntity);
	});

	it("should delete an entity", async () => {
		const id = 1;
		prismaMock.user.delete.mockResolvedValueOnce(undefined);

		await repository.delete(id);

		expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id } });
	});

	it("should get all entities with options", async () => {
		const options = { skip: 0, take: 10, where: { name: "John" } };
		const entities = [
			{ id: 1, name: "John" },
			{ id: 2, name: "John" },
		];
		prismaMock.user.findMany.mockResolvedValueOnce(entities);

		const result = await repository.getAll(options);

		expect(prismaMock.user.findMany).toHaveBeenCalledWith(
			expect.objectContaining(options),
		);
		expect(result).toEqual(entities);
	});

	it("should find the first entity with options", async () => {
		const options = { where: { email: "john@example.com" } };
		const entity = { id: 1, name: "John", email: "john@example.com" };
		prismaMock.user.findFirst.mockResolvedValueOnce(entity);

		const result = await repository.findFirst(options);

		expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
			expect.objectContaining(options),
		);
		expect(result).toEqual(entity);
	});

	it("should construct a query", async () => {
		const query = repository.constructQuery({
			where: {
				name: "John",
			},
		});

		expect(query).toEqual({
			where: {
				name: "John",
			},
		});
	});

	it("should construct a query using search", async () => {
		const query = repository.constructQuery({
			search: "John",
		});

		expect(query).toEqual({
			cursor: undefined,
			skip: undefined,
			take: undefined,
			where: any([
				expect.objectContaining({ name: { contains: "John" } }),
				expect.objectContaining({ email: { contains: "John" } }),
			]),
		});
	});

	it("should construct a query using cursor", async () => {
		const query = repository.constructQuery({
			cursor: { id: 1 },
		});

		expect(query).toEqual({
			cursor: { id: 1 },
			skip: undefined,
			take: undefined,
			where: {},
		});
	});

	it("should construct a query using skip", async () => {
		const query = repository.constructQuery({
			skip: 10,
		});

		expect(query).toEqual({
			cursor: undefined,
			skip: 10,
			take: undefined,
			where: {},
		});

		const query2 = repository.constructQuery({
			skip: 0,
		});

		expect(query2).toEqual({
			cursor: undefined,
			skip: 0,
			take: undefined,
			where: {},
		});
	});

	it("should construct a query using take", async () => {
		const query = repository.constructQuery({
			take: 10,
		});

		expect(query).toEqual({
			cursor: undefined,
			skip: undefined,
			take: 10,
			where: {},
		});

		const query2 = repository.constructQuery({
			take: 0,
		});

		expect(query2).toEqual({
			cursor: undefined,
			skip: undefined,
			take: 0,
			where: {},
		});
	});

	it("should construct a query using WHERE OR", async () => {
		const query = repository.constructQuery({
			where: {
				OR: [{ name: "John" }, { email: "john@example.com" }],
			},
		});

		expect(query).toEqual({
			cursor: undefined,
			skip: undefined,
			take: undefined,
			where: any([
				expect.objectContaining({ name: { contains: "John" } }),
				expect.objectContaining({ email: { contains: "john@example.com" } }),
			]),
		});
	});
});
