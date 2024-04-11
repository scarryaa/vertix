import type { Issue, PullRequest, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface Comment extends BaseEntity {
	id: string;
	body: string;
	created_at: Date;
	updated_at: Date;
	pull_request: PullRequest;
	pull_request_id: string;
	author: UserBasic;
	author_id: string;
	issue: Issue;
	issue_id: string | null;
	deleted_user: boolean;
}
