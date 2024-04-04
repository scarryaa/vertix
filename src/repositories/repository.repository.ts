import type { Prisma, Repository } from "@prisma/client";
import prisma from "../utils/prisma";

export class RepositoryRepository {
	async findById(id: number): Promise<Repository | null> {
		return prisma.repository.findUnique({ where: { id } });
	}

	async findByOwner(ownerId: number): Promise<Repository[]> {
		return prisma.repository.findMany({ where: { ownerId } });
	}

	async findAll(params: {
		where?: Prisma.RepositoryWhereInput;
		take?: number;
		skip?: number;
	}): Promise<{ repositories: Repository[]; totalCount: number }> {
		const { where, take, skip } = params;
		return {
			repositories: await prisma.repository.findMany({ where, take, skip }),
			totalCount: await prisma.repository.count(),
		};
	}

	async create(data: Prisma.RepositoryCreateInput): Promise<Repository> {
		return prisma.repository.create({ data });
	}

	async update(
		id: number,
		data: Prisma.RepositoryUpdateInput,
	): Promise<Repository> {
		return prisma.repository.update({ where: { id }, data });
	}

	async delete(id: number): Promise<Repository> {
		return prisma.repository.delete({ where: { id } });
	}
}
