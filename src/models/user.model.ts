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

export enum Role {
    ADMIN = 0,
    MODERATOR = 1,
    USER = 2
}

export interface User {
	role: Role;
	id: number;
	username: string;
	email: string;
	name: string | null;
	avatar: string | null;
	bio: string | null;
	createdAt: Date;
	updatedAt: Date;
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
	PullRequest: PullRequest | null;
	pullRequestId: number | null;
}
