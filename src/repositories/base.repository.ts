import type { PrismaClient } from "@prisma/client";
import type { QueryOptions } from "../services/base-repository.service";

export interface IRepository<T> {
	getById(id: number): Promise<T | null>;
	create(data: Partial<T>): Promise<T>;
	update(id: number, data: Partial<T>): Promise<T>;
	delete(id: number): Promise<void>;
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

	async getAll(options: QueryOptions<T>): Promise<T[]> {
		// biome-ignore lint/suspicious/noExplicitAny: Must be any
		return await (this.prisma as any)[this.model].getMany(options);
	}
}
