import type { Comment, IssueAssignee, RepositoryDetailed, UserBasic } from ".";

export interface Issue {
	id: number;
	title: string;
	body: string | null;
	status: string;
	created_at: Date;
	updated_at: Date;
	repository: RepositoryDetailed;
	repository_id: number;
	author: UserBasic;
	author_id: number;
	comments: Comment[];
	assignees: IssueAssignee[];
}
