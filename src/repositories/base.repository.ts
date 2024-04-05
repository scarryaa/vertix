import type { Repository, User } from "../models";

type RepositoryInclude<T extends { id: number }> = {
  [P in keyof T]?: boolean;
};

interface FindAllOptions<T extends { id: number }> {
  limit?: number;
  page?: number;
  search?: string;
  visibility?: "public" | "private";
  ownerId?: T["id"];
  skip?: number;
}

interface BaseRepository<
  T extends Repository | User,
  CreateData,
  CreateManyData,
  UpdateData,
  DeleteParams,
> {
  findById(id: T["id"], include: RepositoryInclude<T>): Promise<T | undefined>;
  findAll(options: FindAllOptions<T>): Promise<{ items: Partial<T>[]; totalCount: number }>;
  create(data: CreateData): Promise<Partial<T>>;
  createMany(data: CreateManyData[]): Promise<number>;
  update(id: T["id"], data: UpdateData): Promise<Partial<T>>;
  delete(params: DeleteParams): Promise<Partial<T>>;
}

export type { BaseRepository, RepositoryInclude, FindAllOptions };