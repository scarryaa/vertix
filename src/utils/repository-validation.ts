import type { RepositoryBasic, UserBasic } from "../models";
import type { RepositoryResponse } from "../schemas/repository.schema";
import type { UserResponse } from "../schemas/user.schema";

export function isRepositoryNameValid(name: string): boolean {
	const regex = /^[a-zA-Z0-9-]+$/;
	return regex.test(name);
}

export const mapRepositoryResponse = (
	repository: RepositoryBasic,
	ownerId: string,
	createdAt: Date,
	updatedAt: Date,
	visibility: string,
): RepositoryResponse => ({
	...repository,
	description: repository.description,
	ownerId: ownerId,
	created_at: createdAt,
	visibility: visibility as "public" | "private",
	updated_at: updatedAt,
});

export const mapUserResponse = (
	user: UserBasic,
	createdAt: Date,
	updatedAt: Date,
	index: number,
	array: UserBasic[],
): UserResponse => ({
	created_at: createdAt,
	email: user.email,
	id: user.id,
	name: user.name,
	updated_at: updatedAt,
	username: user.username,
});
