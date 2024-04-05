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

export const Role: "USER" | "ADMIN" | "MODERATOR" = "USER";

export interface User {
	role: typeof Role;
	id?: number;
	username: string;
	password: string;
	email: string;
	name: string;
	avatar?: string;
	bio?: string;
	createdAt?: Date;
	updatedAt?: Date;
	repositories?: Repository[];
	followers?: Follow[];
	following?: Follow[];
	issues?: Issue[];
	stars?: Star[];
	publicEmail?: string;
	preferences?: UserPreference;
	userPreferenceId?: number;
	collaborators?: Collaborator[];
	comments?: Comment[];
	notifications?: Notification[];
	memberships?: Member[];
	pullRequests?: PullRequest[];
	pullRequestsAuthored?: PullRequest[];
	commits?: Commit[];
	pullRequest?: PullRequest;
	pullRequestId?: number;
}
