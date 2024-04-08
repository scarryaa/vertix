import type { RepositoryDetailed, UserBasic } from ".";

export interface Star {
	id: number;
	created_at: Date;
	updated_at: Date;
	repository?: RepositoryDetailed;
	repository_id: number;
	user?: UserBasic;
	user_id: number;
}
