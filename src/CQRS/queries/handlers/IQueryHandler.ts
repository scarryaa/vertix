export abstract class IQueryHandler<TQuery> {
    abstract execute(query: TQuery): Promise<any>;
}
