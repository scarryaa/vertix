import type { Commit, Repository, User } from ".";

export interface PullRequest {
	id: number;
	title: string;
	description: string | null;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	repository: Repository;
	repositoryId: number;
	author: User;
	authorId: number;
	assignees: User[];
	comments: Comment[];
	commits: Commit[];
	headBranch: string;
	baseBranch: string;
	mergedAt: Date | null;
	closedAt: Date | null;
	User: User[];
}
