import type { PullRequest, UserBasic } from ".";

export interface ReviewDetailed {
	id: number;
	body: string;
	created_at: Date;
	updated_at: Date;
	pull_request: PullRequest[];
	pull_request_id: number;
	author: UserBasic;
	author_id: number;
}
