import type { Comment, IssueAssignee, RepositoryDetailed, UserBasic } from ".";

export enum IssueStatus {
	OPEN = "OPEN",
	CLOSED = "CLOSED",
}

export interface Issue {
	id: number;
	title: string;
	body: string | null;
	status: IssueStatus;
	created_at: Date;
	updated_at: Date;
	repository: RepositoryDetailed;
	repository_id: number;
	author: UserBasic;
	author_id: number;
	comments: Comment[];
	assignees: IssueAssignee[];
}
