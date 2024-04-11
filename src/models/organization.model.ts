import type { Member, RepositoryDetailed } from ".";
import type { BaseEntity } from "./base.model";

export interface Organization extends BaseEntity {
	id: string;
	name: string;
	description: string | null;
	created_at: Date;
	updated_at: Date;
	members: Member[];
	repositories: RepositoryDetailed[];
}
