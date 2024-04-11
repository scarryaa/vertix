import type { RepositoryDetailed } from ".";
import type { BaseEntity } from "./base.model";

export interface License extends BaseEntity {
	id: string;
	name: string;
	key: string;
	repositories: RepositoryDetailed[];
}
