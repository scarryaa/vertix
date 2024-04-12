import type {
	IRepository,
	QueryOptions,
} from "../repositories/base.repository";
import type { FileService } from "./file/file.service";

export interface RepositoryServiceConfig<TModel> {
	repository: IRepository<TModel>;
	fileService: FileService;
}

export enum ValidationAction {
	CREATE = 0,
	UPDATE = 1,
	DELETE = 2,
	GET = 3,
	GET_ALL = 4,
}

interface IModel {
	id: string;
	name: string;
}

export class RepositoryService<TModel extends IModel> {
	private readonly repository: IRepository<TModel>;
	private readonly fileService: FileService;

	constructor(private readonly config: RepositoryServiceConfig<TModel>) {
		this.repository = config.repository;
		this.fileService = config.fileService;
	}

	async getAll(
		options: QueryOptions<TModel>,
		authToken?: string,
		detailed?: boolean,
	): Promise<TModel[] | Partial<TModel[]> | Partial<TModel>[] | undefined> {
		const { cursor, skip, take, where } = options;
		const limit = this.parseLimit(take);
		const page = this.parsePage(cursor);
		const skipCount = this.parseSkip(page, limit, skip);
		return this.repository.getAll({
			skip: skipCount,
			take: limit,
			where,
		});
	}

	async create(
		entityData: Partial<TModel>,
		authToken?: string,
	): Promise<TModel> {
		return this.repository.create(entityData);
	}

	async update(
		id: string,
		entityData: Partial<TModel>,
		ownerId?: string,
		authToken?: string,
	): Promise<Partial<TModel>> {
		return this.repository.update(id, entityData);
	}

	async delete(
		id: string,
		ownerId?: string,
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
