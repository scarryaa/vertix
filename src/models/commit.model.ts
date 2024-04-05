import type { PullRequest, UserBasic } from ".";

export interface Commit {
	id: number;
	sha: string;
	message: string;
	created_at: Date;
	pull_request: PullRequest;
	pull_request_id: number;
	author: UserBasic;
	author_id: number;
}
