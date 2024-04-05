import type {
	Collaborator,
	Commit,
	Follow,
	Issue,
	Member,
	PullRequest,
	Repository,
	Star,
	UserPreference,
} from ".";

export interface User {
	id: number;
	role: "USER" | "ADMIN" | "MODERATOR" | string;
	username: string;
	email: string;
	name: string;
	avatar: string | null;
	bio: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
	repositories: Repository[];
	followers: Follow[];
	following: Follow[];
	issues: Issue[];
	stars: Star[];
	password: string;
	publicEmail: string | null;
	preferences: UserPreference | null;
	userPreferenceId: number | null;
	collaborators: Collaborator[];
	comments: Comment[];
	notifications: Notification[];
	memberships: Member[];
	pullRequests: PullRequest[];
	pullRequestsAuthored: PullRequest[];
	commits: Commit[];
	pullRequest: PullRequest | null;
	pullRequestId: number | null;
  }