import { PrismaClient } from "@prisma/client";
import type { QueryOptions } from "../services/base-repository.service";

const prisma = new PrismaClient();

function mapQueryOptionsToPrisma<TModel>(queryOptions: QueryOptions<TModel>) {
	// biome-ignore lint/suspicious/noExplicitAny: Any is needed here
	const prismaOptions: any = {
		where: {},
		include: {},
		take: 10,
		skip: 0,
		cursor: undefined,
		orderBy: undefined,
		select: undefined,
	};

	if (queryOptions.take) prismaOptions.take = queryOptions.take;
	if (queryOptions.skip) prismaOptions.skip = queryOptions.skip;
	if (queryOptions.cursor)
		prismaOptions.cursor = { id: queryOptions.cursor.id };
	if (queryOptions.orderBy) prismaOptions.orderBy = queryOptions.orderBy;
	if (queryOptions.select) prismaOptions.select = queryOptions.select;
	if (queryOptions.where) {
		for (const key in queryOptions.where) {
			// @ts-ignore
			prismaOptions.where[key] = queryOptions.where[key];
		}
	}
	return prismaOptions;
}
