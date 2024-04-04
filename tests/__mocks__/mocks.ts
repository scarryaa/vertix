import type { Repository } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

export const mockRequest = {
	jwt: {
		sign: jest.fn(() => "mocked-token"),
	},
} as unknown as FastifyRequest;

export const mockReply = {
	code: jest.fn().mockReturnThis(),
	send: jest.fn(),
	setCookie: jest.fn(),
	clearCookie: jest.fn(),
} as unknown as FastifyReply;

const repositories: Repository[] = [];

export const mockPrisma = {
	user: {
		findMany: jest.fn(),
		create: jest.fn(() => ({
			id: "mocked-user-id",
			email: "test@example.com",
			name: "Test User",
			username: "testuser",
		})),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
	},
  repository: {
    findMany: jest.fn().mockImplementation(() => repositories),
    create: jest.fn().mockImplementation((data) => {
      const newRepository = {
        id: `mocked-repository-id-${repositories.length + 1}`,
        ...data.data,
      };
      repositories.push(newRepository);
      return newRepository;
    }),
    createMany: jest.fn().mockImplementation((data) => {
      const newRepositories = data.data.map((repo: any, index: any) => ({
        id: `mocked-repository-id-${repositories.length + index + 1}`,
        ...repo,
      }));
      repositories.push(...newRepositories);
      return { count: newRepositories.length };
    }),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
};

export const mockBcrypt = {
	hash: jest.fn(() => "hashed-password"),
	compare: jest.fn(),
};
