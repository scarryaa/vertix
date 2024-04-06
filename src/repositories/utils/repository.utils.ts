import { type Prisma, ProgrammingLanguage } from "@prisma/client";
import { ProgrammingLanguage as ProgrammingLanguageEnum } from "../../models";

type IncludeOptions<T extends Record<string, unknown>> = {
	[K in keyof T]?: {
		select: {
			[P in keyof T[K]]?: boolean;
		};
	};
};

export function buildUserIncludeOptions<T extends Record<string, unknown>>(
	include?: T,
): Prisma.RepositoryInclude {
	const includeOpts: IncludeOptions<T> = {};

	for (const key in include) {
		if (include[key]) {
			includeOpts[key] = {
				select: {},
			};
		}
	}

	return includeOpts;
}
