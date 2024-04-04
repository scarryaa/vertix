import type { Repository, User } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

export const mockRequest = {} as unknown as FastifyRequest;

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
	$queryRawUnsafe: jest.Mock;
	$disconnect: jest.Mock;
	user: {
		findMany: jest.Mock;
		create: jest.Mock;
		findUnique: jest.Mock;
		findFirst: jest.Mock;
		deleteMany: jest.Mock;
		count: jest.Mock;
	};
	repository: {
    delete: jest.Mock;
		deleteMany: jest.Mock;
		count: jest.Mock;
		findMany: jest.Mock;
		create: jest.Mock;
		createMany: jest.Mock;
		findUnique: jest.Mock;
		findFirst: jest.Mock;
    update: jest.Mock;
	};
}

export const mockPrisma: MockPrisma = {
	$queryRawUnsafe: jest.fn(),
	$disconnect: jest.fn(),
	user: {
		findMany: jest.fn(),
		create: jest.fn((data) => {
			const newUser = {
				id: users.length + 1,
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
    delete: jest.fn().mockImplementation((args) => {
      const { where } = args;
      const repositoryToDeleteIndex = repositories.findIndex((repo) => repo.id === where.id);
    
      if (repositoryToDeleteIndex !== -1) {
        const [deletedRepository] = repositories.splice(repositoryToDeleteIndex, 1);
        return Promise.resolve(deletedRepository);
      }
    
      return Promise.reject(new Error(`Repository with id ${where.id} not found`));
    }),
		count: jest.fn().mockImplementation(() => repositories.length),
    findMany: jest.fn().mockImplementation((args) => {
      const { where, take, skip } = args;
      const filteredRepositories = repositories.filter((repo) => {
        let isMatch = true;
        if (where?.ownerId) {
          isMatch = isMatch && repo.ownerId === where.ownerId;
        }
        return isMatch;
      });

      let result = filteredRepositories;

      if (skip) {
        result = result.slice(skip);
      }

      if (take) {
        result = result.slice(0, take);
      }

      return result;
    }),
		create: jest.fn().mockImplementation((data) => {
			const newRepository = {
				id: repositories.length + 1,
				...data.data,
			};
			repositories.push(newRepository);
			return newRepository;
		}),
		createMany: jest.fn().mockImplementation((data) => {
			const newRepositories = data.data.map((repo: any, index: any) => ({
				id: repositories.length + index + 1,
				...repo,
			}));
			repositories.push(...newRepositories);
			return { count: newRepositories.length };
		}),
		findUnique: jest.fn().mockImplementation((args) => {
			const { where } = args;
			const repository = repositories.find((repo) => repo.id === where.id);
			return repository;
		}),
		findFirst: jest.fn(),
    update: jest.fn().mockImplementation((args) => {
      const { data, where } = args;
      const repositoryToUpdate = repositories.find((repo) => repo.id === where.id);
    
      if (repositoryToUpdate) {
        const updatedRepository = { ...repositoryToUpdate, ...data };
        const updatedRepositories = repositories.map((repo) =>
          repo.id === where.id ? updatedRepository : repo
        );
        repositories = updatedRepositories;
        return Promise.resolve(updatedRepository);
      }
    
      return Promise.reject(new Error(`Repository with id ${where.id} not found`));
    }),
	},
};

export const mockBcrypt = {
	hash: jest.fn(() => "hashed-password"),
	compare: jest.fn(),
};
