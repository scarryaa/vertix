import type { PullRequest, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface Commit extends BaseEntity {
	id: string;
	sha: string;
	message: string;
	created_at: Date;
	pull_request: PullRequest;
	pull_request_id: string;
	author: UserBasic;
	author_id: string;
}
