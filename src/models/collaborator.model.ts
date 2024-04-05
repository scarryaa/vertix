import type { RepositoryDetailed, UserBasic } from ".";

export interface CollaboratorDetailed {
	id: number;
	repository: RepositoryDetailed;
	repository_id: number;
	user: UserBasic;
	user_id: number;
}
