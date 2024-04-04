import type { Repository, User } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

export const mockRequest = {
} as unknown as FastifyRequest;

export const mockReply = {
	status: jest.fn().mockReturnThis(),
	send: jest.fn(),
	setCookie: jest.fn(),
	clearCookie: jest.fn(),
  jwtSign: jest.fn(() => "mocked-token"),
} as unknown as FastifyReply;

let repositories: Repository[] = [];
let users: User[] = [];

interface MockPrisma {
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
  user: {
    findMany: jest.Mock;
    create: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    deleteMany: jest.Mock;
    count: jest.Mock;
  };
  repository: {
    deleteMany: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    createMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
  };
}


export const mockPrisma: MockPrisma = {
  $disconnect: jest.fn(),
  $transaction: jest.fn((callback) => callback(mockPrisma)),
  user: {
    findMany: jest.fn(),
    create: jest.fn((data) => {
      const newUser = {
        id: `mocked-user-id-${users.length + 1}`,
        ...data.data,
      };
      users.push(newUser);
      return newUser;
    }),
    findUnique: jest.fn(),
    findFirst: jest.fn((args) => {
      if (args.where.id) {
        return users.find((user) => user.id === args.where.id);
      }
      return null;
    }),
    deleteMany: jest.fn(() => {
      users = [];
    }),
    count: jest.fn().mockImplementation(() => users.length),
  },
  repository: {
    deleteMany: jest.fn(() => {
      repositories = [];
    }),
    count: jest.fn(),
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
