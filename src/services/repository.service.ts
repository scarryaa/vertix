import type { Prisma, Repository } from "@prisma/client";

import type { CollaboratorRepository } from "../repositories/collaborator.repository";
import type { RepositoryRepository } from "../repositories/repository.repository";
import { UnauthorizedError } from "../utils/errors";

export class RepositoryService {
	constructor(
		private repoRepo: RepositoryRepository,
		private collabRepo: CollaboratorRepository,
	) {}

	async findRepositoryById(id: number): Promise<Repository | null> {
		return await this.repoRepo.findById(id);
	}

	async getAllRepositories(
		limit: number | undefined,
		page: number | undefined,
		search: string | undefined,
		visibility: "public" | "private" | undefined,
		ownerId: number | undefined,
	): Promise<{ repositories: Repository[]; totalCount: number }> {
		const whereClause: Prisma.RepositoryWhereInput = {};

		if (search) {
			whereClause.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			];
		}

		if (ownerId !== undefined) {
			whereClause.ownerId = ownerId;
		}

		if (visibility !== undefined) {
			whereClause.visibility = visibility;
		}

		const parsedPage = Math.max(1, page || 1);
		const parsedLimit = Math.min(100, Math.max(1, limit || 20));
		const skip = (parsedPage - 1) * parsedLimit;

		const { repositories, totalCount } = await this.repoRepo.findAll({
			where: whereClause,
			take: parsedLimit,
			skip,
		});

		return { repositories, totalCount };
	}

	async createRepository(
		userId: number,
		data: { name: string; description?: string; visibility: string },
	): Promise<Repository> {
		const { name, description, visibility } = data;

		return this.repoRepo.create({
			name,
			description,
			visibility,
			owner: {
				connect: { id: userId },
			},
		});
	}

	async updateRepository(
		repositoryId: number,
		userId: number,
		data: { name?: string; description?: string; visibility?: string },
	): Promise<Repository> {
		const canUpdate = await this.canUserUpdateRepository(repositoryId, userId);

		if (!canUpdate) {
			throw new UnauthorizedError(
				"You are not authorized to update this repository",
			);
		}

		return this.repoRepo.update(repositoryId, data);
	}

	async deleteRepository(
		repositoryId: number,
		userId: number,
	): Promise<Repository> {
		const canDelete = await this.canUserDeleteRepository(repositoryId, userId);

		if (!canDelete) {
			throw new UnauthorizedError(
				"You are not authorized to delete this repository",
			);
		}

		return this.repoRepo.delete({ where: { id: repositoryId } });
	}

	async isUserCollaborator(
		repositoryId: number,
		userId: number,
	): Promise<boolean> {
		const repository = await this.repoRepo.findById(repositoryId);

		if (repository?.ownerId === userId) {
			return true;
		}

		const collaborator = await this.collabRepo.findOne(repositoryId, userId);

		return !!collaborator;
	}

	private async canUserUpdateRepository(
		repositoryId: number,
		userId: number,
	): Promise<boolean> {
		return this.isUserCollaborator(repositoryId, userId);
	}

	private async canUserDeleteRepository(
		repositoryId: number,
		userId: number,
	): Promise<boolean> {
		return this.isUserCollaborator(repositoryId, userId);
	}
}
