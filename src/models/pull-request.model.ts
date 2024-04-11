import type {
	Commit,
	PullRequestStatus,
	RepositoryDetailed,
	ReviewDetailed,
	UserBasic,
} from ".";
import type { BaseEntity } from "./base.model";

export interface PullRequest extends BaseEntity {
	id: string;
	title: string;
	description: string | null;
	status: PullRequestStatus;
	name: string;
	created_at: Date;
	updated_at: Date;
	repository: RepositoryDetailed;
	repository_id: string;
	author: UserBasic;
	authorId: string;
	pull_request_assignees: UserBasic[];
	comments: Comment[];
	commits: Commit[];
	reviews: ReviewDetailed[];
	head_branch: string;
	base_branch: string;
	merged_at: Date | null;
	closed_at: Date | null;
}
