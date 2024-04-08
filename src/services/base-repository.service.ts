import type {
	IRepository,
	QueryOptions,
} from "../repositories/base.repository";

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

	async getById(
		id: number,
		auth_token?: string,
	): Promise<TModel | Partial<TModel> | null> {
		return this.repository.getById(id);
	}

	async getAll(
		options: QueryOptions<TModel>,
		auth_token?: string,
	): Promise<TModel[] | Partial<TModel[]> | Partial<TModel>[] | undefined> {
		const { cursor, skip, take, where } = options;
		const limit = this.parseLimit(take);
		const page = this.parsePage(cursor);
		const skip_count = this.parseSkip(page, limit, skip);
		return this.repository.getAll({
			skip: skip_count,
			take: limit,
			where,
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
	): Promise<Partial<TModel>> {
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

	private parsePage(cursor?: { id: number }): number {
		if (cursor?.id) {
			return cursor.id;
		}
		return 1;
	}

	private parseSkip(page: number, limit: number, skip?: number): number {
		return skip !== undefined ? skip : (page - 1) * limit;
	}
}
