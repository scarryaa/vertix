import type { RepositoryDetailed } from ".";
import type { BaseEntity } from "./base.model";

export interface Tag extends BaseEntity {
	id: string;
	name: string;
	repositories: RepositoryDetailed[];
}
