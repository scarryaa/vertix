import type { PrismaClient } from "@prisma/client";

export type QueryOptions<T> = {
	skip?: number;
	take?: number;
	cursor?: { id: number };
	where?: WhereCondition<T>;
	search?: string;
};

export type WhereCondition<T> =
	| {
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
	  }
	| {
			OR?: WhereCondition<T>[];
			AND?: WhereCondition<T>[];
			NOT?: WhereCondition<T>[];
	  };

export interface IRepository<T> {
	create(data: Partial<T>): Promise<T>;
	update(id: number, data: Partial<T>): Promise<Partial<T> | T>;
	delete(id: number): Promise<void>;
	getAll(options: QueryOptions<T>): Promise<T[]>;
	findFirst(options: QueryOptions<T>): Promise<T | undefined | null>;
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

			// biome-ignore lint/suspicious/noExplicitAny: Must be any
			return await (this.prisma as any)[this.model].findMany({
				...baseQuery,
				where: {
					...baseQuery.where,
					OR: orConditions,
				},
			});
		}

		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].findMany(baseQuery);
	}

	async findFirst(options: QueryOptions<T>): Promise<T | undefined | null> {
		const { skip, take, cursor, where, search } = options;

		const baseQuery = {
			skip,
			take,
			cursor: cursor?.id ? { id: cursor.id } : undefined,
			where: {
				...where,
			},
		};

		let orConditions: any[] = [];

		if (search) {
			orConditions = this.searchableFields.map((field) => ({
				[field]: {
					contains: search,
					mode: "insensitive",
				},
			}));
		}

		if ((where as any).OR) {
			orConditions = [...orConditions, ...(where as any).OR];
		}

		if (orConditions.length > 0) {
			baseQuery.where = {
				...baseQuery.where,
				OR: orConditions,
			};
		}

		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].findFirst(baseQuery);
	}
}
