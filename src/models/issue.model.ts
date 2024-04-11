import type { Comment, IssueAssignee, RepositoryDetailed, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export enum IssueStatus {
	OPEN = "OPEN",
	CLOSED = "CLOSED",
}

export interface Issue extends BaseEntity {
	id: string;
	title: string;
	body: string | null;
	status: IssueStatus;
	created_at: Date;
	updated_at: Date;
	repository: RepositoryDetailed;
	repository_id: string;
	author: UserBasic;
	author_id: string;
	comments: Comment[];
	assignees: IssueAssignee[];
}
