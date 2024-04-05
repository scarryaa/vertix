import type {
	Prisma,
	PrismaClient,
	Repository as PrismaRepository,
} from "@prisma/client";
import type { Repository } from "../models";
import type {
	BaseRepository,
	FindAllOptions,
	RepositoryInclude,
} from "./base.repository";
import { buildUserIncludeOptions } from "./utils/repository.utils";

interface RepositoryRepository
	extends BaseRepository<
		Repository,
		Prisma.RepositoryCreateInput,
		Prisma.RepositoryUpdateInput,
		Prisma.RepositoryCreateManyInput,
		{ where: Prisma.RepositoryWhereUniqueInput }
	> {}

export class RepositoryRepositoryImpl implements RepositoryRepository {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async findById(
		id: number,
		include?: RepositoryInclude<Repository>,
	): Promise<Repository | undefined> {
		const includeOpts: Prisma.RepositoryInclude =
			buildUserIncludeOptions(include);

		const res = await this.prisma.repository.findUnique({
			where: { id },
			include: includeOpts,
		});

		if (!res) {
			return undefined;
		}

		return res;
	}

	async findAll(
		options: FindAllOptions<Repository>,
	): Promise<{ items: Repository[]; totalCount: number }> {
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

		return { items: repositories, totalCount };
	}

	async create(data: Prisma.RepositoryCreateInput): Promise<Repository> {
		return await this.prisma.repository.create({ data });
	}

	async createMany(data: Prisma.RepositoryCreateManyInput[]): Promise<number> {
		const res = await this.prisma.repository.createMany({ data });
		return res.count;
	}

	async update(
		id: number,
		data: Prisma.RepositoryUpdateInput,
	): Promise<Repository> {
		return await this.prisma.repository.update({ where: { id }, data });
	}

	async delete(params: {
		where: Prisma.RepositoryWhereUniqueInput;
	}): Promise<Repository> {
		const { where } = params;
		return await this.prisma.repository.delete({ where });
	}

	async findByOwnerId(ownerId: number): Promise<Repository[]> {
		return await this.prisma.repository.findMany({ where: { ownerId }});
	}
}
