import type { RepositoryDetailed, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface Star extends BaseEntity {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	repository?: RepositoryDetailed;
	repositoryId: string;
	user?: UserBasic;
	userId: string;
}
