import {
	mockBcrypt,
	mockPrisma,
	mockReply,
	mockRequest,
} from "./__mocks__/mocks";

jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("bcrypt", () => mockBcrypt);

import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";

import type { FastifyReply, FastifyRequest } from "fastify";
import {
	createRepository,
	deleteRepository,
	getAllRepositories,
	updateRepository,
} from "../src/controllers/repository.controller";
import type { RepositoryInput } from "../src/schemas/repository.schema";
import prisma from "../src/utils/prisma";

describe("Repository Controller", () => {
	let ownerId: number;

	beforeAll(async () => {
		// Create owner
		const user = await prisma.user.create({
			data: {
				username: "testuser",
				email: "testuser@example.com",
				password: "password",
			},
		});
		ownerId = user.id;
	});
	afterEach(async () => {
		jest.clearAllMocks();
		repositories = [];
	});

	afterAll(async () => {
		await prisma.repository.deleteMany();
		await prisma.user.deleteMany();
		await prisma.$disconnect();
	});

	let repositories = [];

	describe("createRepository", () => {
		it("should create a new repository", async () => {
			const mockRequest = {
				body: {
					name: "test-repo",
					ownerId: ownerId,
					description: "This is a test repository",
					visibility: "public",
				},
			} as FastifyRequest<{ Body: RepositoryInput }>;

			const mockReply = {
				code: jest.fn().mockReturnThis(),
				send: jest.fn(),
			} as unknown as FastifyReply;

			const newRepo = await createRepository(mockRequest, mockReply);
			repositories.push(newRepo);

			expect(mockReply.code).toHaveBeenCalledWith(201);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "test-repo",
					id: `mocked-repository-id-${repositories.length}`,
					owner: { connect: { id: ownerId } },
					description: "This is a test repository",
					visibility: "public",
				}),
			);
		});
	});

	describe("getAllRepositories", () => {
		it("should return all repositories", async () => {
			// Create sample repositories in the database
			await prisma.repository.createMany({
				data: [
					{ name: "Repo 1", ownerId: 1, visibility: "public" },
					{ name: "Repo 2", ownerId: 2, visibility: "private" },
				],
			});

			const mockRequest = {
				query: {
					limit: 20,
					page: 1,
				},
			} as FastifyRequest;
			const mockReply = {
				code: jest.fn().mockReturnThis(),
				send: jest.fn(),
			} as unknown as FastifyReply;

			// @ts-ignore
			await getAllRepositories(mockRequest, mockReply);

			expect(mockReply.code).toHaveBeenCalledWith(200);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 20,
					page: 1,
					repositories: expect.arrayContaining([
						expect.objectContaining({
							name: "Repo 1",
							ownerId: 1,
							visibility: "public",
						}),
						expect.objectContaining({
							name: "Repo 2",
							ownerId: 2,
							visibility: "private",
						}),
					]),
				}),
			);
		});
	});
});
