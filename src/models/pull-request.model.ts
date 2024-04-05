export interface PullRequest {
	id: number;
	title: string;
	description: string | null;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	repositoryId: number;
	authorId: number;
	headBranch: string;
	baseBranch: string;
	mergedAt: Date | null;
	closedAt: Date | null;
  }