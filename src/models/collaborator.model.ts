import type { RepositoryDetailed, UserBasic } from ".";

export interface ContributorDetailed {
	id: number;
	repository: RepositoryDetailed;
	repository_id: number;
	user: UserBasic;
	user_id: number;
}
