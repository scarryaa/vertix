import type { RepositoryDetailed, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface ContributorDetailed extends BaseEntity {
	id: string;
	repository: RepositoryDetailed;
	repository_id: string;
	user: UserBasic;
	user_id: string;
}
