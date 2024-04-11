import type { RepositoryBasic, TVisibility, UserBasic } from "../models";
import type { RepositoryResponse } from "../schemas/repository.schema";
import type { UserResponse } from "../schemas/user.schema";
import prisma from "./prisma";

export function isRepositoryNameValid(name: string): boolean {
	const regex = /^[a-zA-Z0-9-]+$/;
	return regex.test(name);
}

export const mapRepositoryResponse = (
	repository: RepositoryBasic,
	owner_id: string,
	created_at: Date,
	updated_at: Date,
	visibility: string,
): RepositoryResponse => ({
	...repository,
	description: repository.description,
	owner_id,
	created_at: created_at,
	visibility: visibility as "public" | "private",
	updated_at: updated_at,
});

export const mapUserResponse = (
	user: UserBasic,
	created_at: Date,
	updated_at: Date,
	index: number,
	array: UserBasic[],
): UserResponse => ({
	created_at,
	email: user.email,
	id: user.id,
	name: user.name,
	updated_at,
	username: user.username,
});
