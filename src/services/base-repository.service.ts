import type { IRepository } from "../repositories/base.repository";

export interface QueryOptions<TModel> {
	limit?: number;
	page?: number;
	skip?: number;
	search?: Partial<TModel>;
}

export interface RepositoryServiceConfig<TModel> {
	repository: IRepository<TModel>;
}

export enum ValidationAction {
	CREATE = 0,
	UPDATE = 1,
	DELETE = 2,
	GET = 3,
	GET_ALL = 4,
}

export class RepositoryService<TModel> {
	private readonly repository: IRepository<TModel>;

	constructor(private readonly config: RepositoryServiceConfig<TModel>) {
		this.repository = config.repository;
	}

	async getById(id: number, auth_token?: string): Promise<TModel | null> {
		return this.repository.getById(id);
	}

	async getAll(
		options: QueryOptions<TModel>,
		auth_token?: string,
	): Promise<TModel[]> {
		const { limit, page, skip, search } = options;
		const parsedLimit = this.parseLimit(limit);
		const parsedPage = this.parsePage(page);
		const parsedSkip = this.parseSkip(parsedPage, parsedLimit, skip);

		return this.repository.getAll({
			limit: parsedLimit,
			skip: parsedSkip,
			page: parsedPage,
			search,
		});
	}

	async create(
		entity_data: Partial<TModel>,
		auth_token?: string,
	): Promise<TModel> {
		return this.repository.create(entity_data);
	}

	async update(
		id: number,
		entityData: Partial<TModel>,
		owner_id?: number,
		auth_token?: string,
	): Promise<TModel> {
		return this.repository.update(id, entityData);
	}

	async delete(
		id: number,
		owner_id?: number,
		authToken?: string,
	): Promise<void> {
		await this.repository.delete(id);
	}

	// Helpers

	private parseLimit(limit?: number): number {
		return Math.min(100, Math.max(1, limit || 20));
	}

	private parsePage(page?: number): number {
		return Math.max(1, page || 1);
	}

	private parseSkip(page: number, limit: number, skip?: number): number {
		return skip !== undefined ? skip : (page - 1) * limit;
	}
}
