import type { RepositoryDetailed, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface Star extends BaseEntity {
	id: string;
	created_at: Date;
	updated_at: Date;
	repository?: RepositoryDetailed;
	repository_id: string;
	user?: UserBasic;
	user_id: string;
}
