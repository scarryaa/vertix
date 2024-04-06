export type IncludeOptions<TModel> = {
	[Key in keyof TModel]?: boolean;
};

type FindAllOptionsBase<TModel> = {
	limit?: number;
	page?: number;
	search?: string;
	skip?: number;
};

export type FindAllOptions<TModel, TWhereInput> = FindAllOptionsBase<TModel> & {
	where?: TWhereInput;
};

export interface IRepository<
	TModel,
	TCreateInput,
	TUpdateInput,
	TCreateManyInput,
	TWhereUniqueInput,
	TWhereInput,
> {
	findById(
		id: number,
		include?: IncludeOptions<TModel>,
	): Promise<TModel | undefined>;
	delete(params: { where: TWhereUniqueInput }): Promise<Partial<TModel>>;
	findAll(
		options: FindAllOptions<TModel, TWhereInput>,
	): Promise<{ items: TModel[]; totalCount: number }>;
	create(data: TCreateInput): Promise<TModel>;
	update(id: number, data: TUpdateInput): Promise<TModel>;
}
