import { type DataSource, type EntityTarget, Repository } from "typeorm";

export class BaseRepository<T> extends Repository<T> {
	constructor(target: EntityTarget<T>, dataSource: DataSource) {
		super(target, dataSource.createEntityManager());
	}
}
