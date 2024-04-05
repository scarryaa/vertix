import type { PrismaClient } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { type DeepMockProxy, mockDeep } from "jest-mock-extended";
import { CollaboratorRepository } from "../../src/repositories/collaborator.repository";
import { RepositoryRepositoryImpl } from "../../src/repositories/repository.repository";
import { RepositoryService } from "../../src/services/repository.service";

export const mockRequest = {} as unknown as FastifyRequest;
export const mockReply = {
	status: jest.fn().mockReturnThis(),
	send: jest.fn(),
	setCookie: jest.fn(),
	clearCookie: jest.fn(),
	jwtSign: jest.fn(() => "mocked-token"),
} as unknown as FastifyReply;

export class MockCollaboratorRepositoryImpl extends CollaboratorRepository {
	constructor(mockContext: MockContext) {
		super(mockContext.prisma);
	}
}

export class MockRepositoryRepositoryImpl extends RepositoryRepositoryImpl {
	constructor(mockContext: MockContext) {
		super(mockContext.prisma);
	}

	findById = jest.fn();
	findAll = jest.fn();
	create = jest.fn();
	createMany = jest.fn();
	update = jest.fn();
	delete = jest.fn();
	findByOwnerId = jest.fn();
}

export class MockRepositoryService extends RepositoryService {}

// Prisma

export type Context = {
	prisma: PrismaClient;
};

export type MockContext = {
	prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): MockContext => {
	return {
		prisma: mockDeep<PrismaClient>(),
	};
};

// bcrypt

export const mockBcrypt = {
	hash: jest.fn(() => "hashed-password"),
	compare: jest.fn(),
};
