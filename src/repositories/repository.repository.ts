import type { Prisma, PrismaClient, Repository } from "@prisma/client";
import type { Repository as RepositoryModel } from "../models";

export class RepositoryRepository {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async findById(id: number): Promise<RepositoryModel | null> {
		return this.prisma.repository.findUnique({ where: { id } });
	}

	async findByOwner(ownerId: number): Promise<RepositoryModel[]> {
		return this.prisma.repository.findMany({ where: { ownerId } });
	}

	async findAll(options: {
		limit?: number;
		page?: number;
		search?: string;
		visibility?: "public" | "private";
		ownerId?: number;
		skip?: number;
	}): Promise<{ repositories: Repository[]; totalCount: number }> {
		const { limit, page, search, visibility, ownerId, skip } = options;
		// biome-ignore lint/suspicious/noExplicitAny: need any here
		const whereClause: any = {};

		if (search) {
			whereClause.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			];
		}

		if (ownerId !== undefined) {
			whereClause.ownerId = ownerId;
		}

		if (visibility !== undefined) {
			whereClause.visibility = visibility;
		}

		const parsedPage = Math.max(1, page || 1);
		const parsedLimit = Math.min(100, Math.max(1, limit || 20));
		const parsedSkip = skip || 0;

		const repositories = await this.prisma.repository.findMany({
			where: whereClause,
			take: parsedLimit,
			skip: parsedSkip,
		});

		const totalCount = await this.prisma.repository.count({
			where: whereClause,
		});

		return { repositories, totalCount };
	}

	async create(data: Prisma.RepositoryCreateInput): Promise<RepositoryModel> {
		return this.prisma.repository.create({ data });
	}

	async createMany(
		data: Prisma.RepositoryCreateManyInput[],
	): Promise<RepositoryModel[]> {
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
	): Promise<RepositoryModel> {
		return this.prisma.repository.update({ where: { id }, data });
	}

	async delete(params: {
		where: Prisma.RepositoryWhereUniqueInput;
	}): Promise<RepositoryModel> {
		const { where } = params;
		return this.prisma.repository.delete({ where });
	}
}
