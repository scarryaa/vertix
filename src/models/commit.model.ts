import type { PullRequest, User } from ".";

export interface Commit {
	id: number;
	sha: string;
	message: string;
	createdAt: Date;
	pullRequest: PullRequest;
	pullRequestId: number;
	author: User;
	authorId: number;
}
