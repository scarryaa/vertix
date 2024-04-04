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

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

import type { FastifyReply, FastifyRequest } from "fastify";
import {
	createRepository,
	deleteRepository,
	getAllRepositories,
	getRepositoryById,
	updateRepository,
} from "../src/modules/repository/repository.controller";
import type { RepositoryInput } from "../src/modules/repository/repository.schema";

describe("Repository Controller", () => {
	afterEach(async () => {
		jest.clearAllMocks();
        repositories = [];
	});

	const prisma = new PrismaClient();
    let repositories = [];

	describe("createRepository", () => {
		it("should create a new repository", async () => {
			const mockRequest = {
				body: {
					name: "Test Repository",
					ownerId: 1,
					description: "This is a test repository",
					visibility: "public",
				},
			} as FastifyRequest<{ Body: RepositoryInput }>;
			const mockReply = {
				code: jest.fn().mockReturnThis(),
				send: jest.fn(),
			} as unknown as FastifyReply;

			await createRepository(mockRequest, mockReply);

			expect(mockReply.code).toHaveBeenCalledWith(201);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Test Repository",
					ownerId: 1,
					description: "This is a test repository",
					visibility: "public",
                    id: `mocked-repository-id-${repositories.length + 1}`,
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

			const mockRequest = {} as FastifyRequest;
			const mockReply = {
				code: jest.fn().mockReturnThis(),
				send: jest.fn(),
			} as unknown as FastifyReply;

			await getAllRepositories(mockRequest, mockReply);

			expect(mockReply.code).toHaveBeenCalledWith(200);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.arrayContaining([
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
			);
		});
	});
});
