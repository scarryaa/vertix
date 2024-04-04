import type { Prisma, PrismaClient, Repository } from "@prisma/client";

export class RepositoryRepository {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async findById(id: number): Promise<Repository | null> {
		return this.prisma.repository.findUnique({ where: { id } });
	}

	async findByOwner(ownerId: number): Promise<Repository[]> {
		return this.prisma.repository.findMany({ where: { ownerId } });
	}

	async findAll(params: {
		where?: Prisma.RepositoryWhereInput;
		take?: number;
		skip?: number;
	}): Promise<{ repositories: Repository[]; totalCount: number }> {
		const { where, take, skip } = params;
		return {
			repositories: await this.prisma.repository.findMany({
				where,
				take,
				skip,
			}),
			totalCount: await this.prisma.repository.count(),
		};
	}

	async create(data: Prisma.RepositoryCreateInput): Promise<Repository> {
		return this.prisma.repository.create({ data });
	}

	async createMany(
		data: Prisma.RepositoryCreateManyInput[],
	): Promise<Repository[]> {
		const batchPayload = await this.prisma.repository.createMany({ data });

		const createdIds = batchPayload.count
			? [...Array(batchPayload.count).keys()].map((_, i) => i + 1)
			: [];

		const createdRepositories = await this.prisma.repository.findMany({
			where: {
				id: {
					in: createdIds,
				},
			},
		});

		return createdRepositories;
	}

	async update(
		id: number,
		data: Prisma.RepositoryUpdateInput,
	): Promise<Repository> {
		return this.prisma.repository.update({ where: { id }, data });
	}

	async delete(params: {
		where: Prisma.RepositoryWhereUniqueInput;
	}): Promise<Repository> {
		const { where } = params;
		return this.prisma.repository.delete({ where });
	}
}
