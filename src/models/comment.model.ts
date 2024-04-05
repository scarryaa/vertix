import type { Issue, PullRequest, UserBasic } from ".";

export interface Comment {
	id: number;
	body: string;
	created_at: Date;
	updated_at: Date;
	pull_request: PullRequest;
	pull_request_id: number;
	author: UserBasic;
	author_id: number;
	issue: Issue;
	issue_id: number | null;
	deleted_user: boolean;
}
