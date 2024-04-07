import type { PrismaClient } from "@prisma/client";
import type { Sql } from "@prisma/client/runtime/library";

export type QueryOptions<T> = {
	skip?: number;
	take?: number;
	cursor?: { id: number };
	where?: WhereCondition<T>;
};

export type WhereCondition<T> = {
	[K in keyof T]?:
		| T[K]
		| (T[K] extends string
				? {
						contains: string;
					}
				: T[K] extends Date
					? {
							greaterThan?: Date;
							lessThan?: Date;
							at?: Date;
							not?: Date;
						}
					: T[K] extends Array<infer U>
						? {
								some?: WhereCondition<U>;
							}
						: never);
};

export interface IRepository<T> {
	getById(id: number): Promise<T | null>;
	create(data: Partial<T>): Promise<T>;
	update(id: number, data: Partial<T>): Promise<T>;
	delete(id: number): Promise<void>;
	findOne(where?: WhereCondition<T>): Promise<T | null>;
	findBy(where: WhereCondition<T>): Promise<T[]>;
	getAll(options: QueryOptions<T>): Promise<T[]>;
}

export class PrismaRepository<T> implements IRepository<T> {
	private readonly prisma: PrismaClient;
	private readonly model: string;

	constructor(prisma: PrismaClient, model: string) {
		this.prisma = prisma;
		this.model = model;
	}

	async getById(id: number): Promise<T | null> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].findUnique({ where: { id } });
	}

	async create(data: Partial<T>): Promise<T> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].create({ data });
	}

	async update(id: number, data: Partial<T>): Promise<T> {
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

	async getAll(options: {
		skip?: number;
		take?: number;
		cursor?: { id: number };
		where?: WhereCondition<T>;
	}): Promise<T[]> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].findMany(
			Object.assign({
				skip: options.skip,
				take: options.take,
				cursor: options.cursor,
				where: options.where,
			}),
		);
	}

	async findOne(where?: WhereCondition<T>): Promise<T | null> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].findFirst({
			where,
			take: 1,
			skip: 0,
			cursor: { id: 0 },
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
