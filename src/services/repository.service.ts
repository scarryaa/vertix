import type { RepositoryBasic } from "../models";
import type { CollaboratorRepository } from "../repositories/collaborator.repository";
import type { RepositoryBasicRepository } from "../repositories/repository-basic.repository";
import { UnauthorizedError } from "../utils/errors";

interface RepositoryQueryOptions {
	limit?: number;
	page?: number;
	search?: string;
	visibility?: "public" | "private";
	ownerId?: number;
	skip?: number;
}

export class RepositoryService {
	constructor(
		private repoRepo: RepositoryBasicRepository,
		private collabRepo: CollaboratorRepository,
	) {}

	async findById(id: number): Promise<RepositoryBasic | undefined> {
		return await this.repoRepo.findById(id);
	}

	async getAll(
		options: RepositoryQueryOptions,
	): Promise<{ repositories: RepositoryBasic[]; totalCount: number }> {
		const { limit = 20, page = 1, search, visibility, ownerId, skip } = options;
		const parsedLimit = parseLimit(limit);
		const parsedPage = parsePage(page);
		const parsedSkip = parseSkip(parsedPage, parsedLimit, skip);

		const { items, totalCount } = await this.repoRepo.findAll({
			limit: parsedLimit,
			page: parsedPage,
			search: search,
			skip: parsedSkip,
		});

		return { repositories: items, totalCount };
	}

	async create(
		userId: number,
		data: { name: string; description?: string; visibility: string },
	): Promise<RepositoryBasic> {
		const { name, description, visibility } = data;

		return this.repoRepo.create({
			name,
			description,
			visibility,
			owner: {},
		});
	}

	async update(
		repositoryId: number,
		userId: number,
		data: { name?: string; description?: string; visibility?: string },
	): Promise<RepositoryBasic> {
		const canUpdate = await this.canUserUpdateRepository(repositoryId, userId);

		if (!canUpdate) {
			throw new UnauthorizedError(
				"You are not authorized to update this repository",
			);
		}

		return this.repoRepo.update(repositoryId, data);
	}

	async delete(repositoryId: number, userId: number): Promise<RepositoryBasic> {
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

		if (repository?.owner_id === userId) {
			return true;
		}

		const collaborator = await this.collabRepo.findOne(repositoryId, userId);

		return !!collaborator;
	}

	async isUserOwner(repositoryId: number, userId: number): Promise<boolean> {
		const repository = await this.repoRepo.findById(repositoryId);

		return repository?.owner_id === userId;
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
		return this.isUserOwner(repositoryId, userId);
	}
}

// Helpers
function parseLimit(limit?: number): number {
	return Math.min(100, Math.max(1, limit || 20));
}

function parsePage(page?: number): number {
	return Math.max(1, page || 1);
}

function parseSkip(page: number, limit: number, skip?: number): number {
	return skip !== undefined ? skip : (page - 1) * limit;
}
