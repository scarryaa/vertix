import type { Issue, UserBasic } from ".";

export interface IssueAssignee {
	id: number;
	issue: Issue;
	issue_id: number;
	user: UserBasic;
	user_id: number;
}
