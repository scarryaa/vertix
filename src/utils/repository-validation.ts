import type { RepositoryBasic } from "../models";
import type { RepositoryResponse } from "../schemas/repository.schema";
import prisma from "./prisma";

export function isRepositoryNameValid(name: string): boolean {
	const regex = /^[a-zA-Z0-9-]+$/;
	return regex.test(name);
}

export const mapRepositoryResponse = (
	repository: RepositoryBasic,
	owner_id: number,
	created_at: Date,
	updated_at: Date,
	visibility?: string,
): RepositoryResponse => ({
	...repository,
	description: repository.description,
	owner_id,
	created_at: created_at,
	visibility: visibility as "public" | "private",
	updated_at: updated_at,
});
