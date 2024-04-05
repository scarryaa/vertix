import type { Issue, PullRequest, User } from ".";

export interface Comment {
    id: number;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    pullRequest: PullRequest;
    pullRequestId: number;
    author: User;
    authorId: number;
    Issue: Issue | null;
    issueId: number | null;
  }