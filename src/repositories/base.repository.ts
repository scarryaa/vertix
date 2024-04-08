import type { PrismaClient } from "@prisma/client";

export type QueryOptions<T> = {
	skip?: number;
	take?: number;
	cursor?: { id: number };
	where?: WhereCondition<T>;
	search?: string;
};

export type WhereCondition<T> = {
	[K in keyof T]?:
		| NonNullable<T[K]>
		| (NonNullable<T[K]> extends string
				? {
						contains: string;
					}
				: NonNullable<T[K]> extends Date
					? {
							greaterThan?: Date;
							lessThan?: Date;
							at?: Date;
							not?: Date;
						}
					: NonNullable<T[K]> extends Array<infer U>
						? {
								some?: WhereCondition<U>;
							}
						: never);
};

export interface IRepository<T> {
	getById(id: number): Promise<T | null>;
	create(data: Partial<T>): Promise<T>;
	update(id: number, data: Partial<T>): Promise<Partial<T> | T>;
	delete(id: number): Promise<void>;
	findOne(where?: WhereCondition<T>): Promise<T | null>;
	findBy(where: WhereCondition<T>): Promise<T[]>;
	getAll(options: QueryOptions<T>): Promise<T[]>;
}

export class PrismaRepository<T> implements IRepository<T> {
	public readonly prisma: PrismaClient;
	private readonly model: string;
	private readonly searchableFields: (keyof T)[];

	constructor(
		prisma: PrismaClient,
		model: string,
		searchableFields: (keyof T)[],
	) {
		this.prisma = prisma;
		this.model = model;
		this.searchableFields = searchableFields;
	}

	async getById(id: number): Promise<T | null> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].findUnique({ where: { id } });
	}

	async create(data: Partial<T>): Promise<T> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].create({ data });
	}

	async update(id: number, data: Partial<T>): Promise<Partial<T> | T> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].update({
			where: { id },
			data,
		});
	}

	async delete(id: number): Promise<void> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		await (this.prisma as any)[this.model].delete({ where: { id } });
	}

	async getAll(options: QueryOptions<T>): Promise<T[]> {
		const { skip, take, cursor, where, search } = options;

		const baseQuery = {
			skip,
			take,
			cursor: cursor?.id ? { id: cursor.id } : undefined,
			where: {
				...where,
			},
		};

		if (search) {
			const orConditions = this.searchableFields.map((field) => ({
				[field]: {
					contains: search,
					mode: "insensitive",
				},
			}));

			return await (this.prisma as any)[this.model].findMany({
				...baseQuery,
				where: {
					...baseQuery.where,
					OR: orConditions,
				},
			});
		}

		return await (this.prisma as any)[this.model].findMany(baseQuery);
	}

	async findOne(where?: WhereCondition<T>): Promise<T | null> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].findFirst({
			where,
			take: 1,
			skip: 0,
			cursor: { id: 1 },
			orderBy: { id: "asc" },
			select: { id: true },
		});
	}

	async findBy(where: WhereCondition<T>): Promise<T[]> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].findMany({
			where,
		});
	}
}
