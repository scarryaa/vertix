import type {
	Commit,
	PullRequestStatus,
	RepositoryDetailed,
	ReviewDetailed,
	UserBasic,
} from ".";

export interface PullRequest {
	id: number;
	title: string;
	description: string | null;
	status: PullRequestStatus;
	created_at: Date;
	updated_at: Date;
	repository: RepositoryDetailed;
	repository_id: number;
	author: UserBasic;
	authorId: number;
	pull_request_assignees: UserBasic[];
	comments: Comment[];
	commits: Commit[];
	reviews: ReviewDetailed[];
	head_branch: string;
	base_branch: string;
	merged_at: Date | null;
	closed_at: Date | null;
}
