import type { Prisma, PrismaClient } from "@prisma/client";
import { ProgrammingLanguage as PrismaProgrammingLanguage } from "@prisma/client";
import type {
	RepositoryBasic,
	RepositoryCreateInput,
	RepositoryDetailed,
	RepositoryUpdateInput,
} from "../models";
import type {
	FindAllOptions,
	IRepository,
	IncludeOptions,
} from "./repository.interface";

export class RepositoryBasicRepository
	implements
		IRepository<
			RepositoryBasic,
			RepositoryCreateInput,
			RepositoryUpdateInput,
			Prisma.RepositoryCreateManyInput,
			Prisma.RepositoryWhereUniqueInput,
			Prisma.RepositoryWhereInput
		>
{
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async create(data: RepositoryCreateInput): Promise<RepositoryBasic> {
		const { programming_languages, ...rest } = data;

		return await this.prisma.repository.create({
			data: {
				...rest,
				organization: {
					create: {
						...data.organization,
						name: data.organization?.name ?? "",
						members: {
							create: data.organization?.members ?? [],
						},
					},
				},
				license: { create: data.license ?? undefined },
				programming_languages: {
					set:
						programming_languages?.map(
							(lang) => PrismaProgrammingLanguage[lang],
						) ?? [],
				},
				owner: {
					connect: {
						id: data.owner.id,
					},
				},
			},
		});
	}

	async findById(
		id: number,
		include?: IncludeOptions<RepositoryDetailed>,
	): Promise<RepositoryBasic | undefined> {
		const includeOptions: Prisma.RepositorySelect = {
			owner: include?.owner,
			stars: include?.stars,
			collaborators: include?.collaborators,
		};

		const repository = await this.prisma.repository.findUnique({
			where: { id },
			include: {
				...includeOptions,
			},
		});

		if (repository === null) return undefined;
		return repository;
	}

	delete(params: {
		where: Prisma.RepositoryWhereUniqueInput;
	}): Promise<RepositoryBasic> {
		throw new Error("Method not implemented.");
	}

	async findAll(
		options: FindAllOptions<RepositoryBasic, Prisma.RepositoryWhereInput>,
	): Promise<{ items: RepositoryBasic[]; totalCount: number }> {
		const { limit, page, search, where, skip } = options;

		const whereClause: Prisma.RepositoryWhereInput = { ...where };

		if (search) {
			whereClause.OR ||= [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			];
		}
		const parsedPage = Math.max(1, page || 1);
		const parsedLimit = Math.min(100, Math.max(1, limit || 20));
		const parsedSkip = skip || 0;

		const repositories = await this.prisma.repository.findMany({
			where: whereClause,
			take: parsedLimit,
			skip: parsedSkip,
			select: {
				id: true,
				name: true,
				description: true,
				visibility: true,
				owner_id: true,
				created_at: true,
				updated_at: true,
			},
		});

		const totalCount = await this.prisma.repository.count({
			where: whereClause,
		});

		return { items: repositories, totalCount };
	}

	async update(
		id: number,
		data: RepositoryUpdateInput,
	): Promise<RepositoryBasic> {
		const updatedData: Prisma.RepositoryUpdateInput = {
			name: data.name,
			description: data.description,
			visibility: data.visibility,
			programming_languages: {
				set: data.programming_languages
					?.map((language) => language ?? undefined)
					.filter((language) => language !== undefined),
			},
		};

		return await this.prisma.repository.update({
			where: { id },
			data: updatedData,
		});
	}
}
