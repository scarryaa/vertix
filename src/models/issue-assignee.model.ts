import type { Issue, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface IssueAssignee extends BaseEntity {
	id: string;
	issue: Issue;
	issue_id: string;
	user: UserBasic;
	user_id: string;
}
