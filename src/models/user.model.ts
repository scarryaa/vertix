import type {
	CollaboratorDetailed,
	Commit,
	Follow,
	Issue,
	IssueAssignee,
	Language,
	Member,
	ProgrammingLanguage,
	PullRequest,
	RepositoryDetailed,
	ReviewDetailed,
	SocialLogin,
	Star,
	Timezone,
	UserActivityType,
	UserEventType,
	UserPreferences,
	UserRole,
	UserStatus,
} from ".";

export interface UserDetailed {
	// Essentials
	id: number;
	role: UserRole;
	created_at: Date;
	updated_at: Date;
	username: string;
	email: string;
	password: string;
	name: string;
	avatar: string | null;
	bio: string | null;
	public_email: string | null;
	verified_email: boolean;
	languages: Language[];
	preferred_languages: Language[];
	programming_languages: ProgrammingLanguage[];
	timezone: Timezone;
	status: UserStatus;
	user_preferences_id: number;

	// Events
	last_login_at: Date | null;
	deleted_at: Date | null;

	// Auth
	reset_password_token?: string | null;
	reset_password_expires?: Date | null;
	two_factor_enabled: boolean;
	phone: string | null;

	// Extra
	location: string | null;
	website: string | null;
	deleted: boolean;

	// Relations
	assigned_issues: IssueAssignee[];
	social_logins: SocialLogin[];
	repositories: RepositoryDetailed[];
	followers: Follow[];
	following: Follow[];
	issues: Issue[];
	stars: Star[];
	collaborators: CollaboratorDetailed[];
	comments: Comment[];
	notifications: Notification[];
	memberships: Member[];
	pull_requests: PullRequest[];
	pull_request_authors: PullRequest[];
	commits: Commit[];
	user_preferences: UserPreferences;
	reviews: ReviewDetailed[];
}

export interface UserBasic
	extends Pick<
		UserDetailed,
		| "id"
		| "role"
		| "updated_at"
		| "created_at"
		| "username"
		| "email"
		| "name"
		| "avatar"
		| "bio"
		| "public_email"
		| "repositories"
	> {}

// Search
export interface UserSearchCriteria {
	username?: string;
	email?: string;
}

// Stats
export interface UserStats {
	userId: number;
	repositoryCount: number;
	followerCount: number;
	followingCount: number;
}

// Events
export interface UserEvent {
	userId: number;
	eventType: UserEventType;
	timestamp: Date;
}

export interface UserActivity {
	userId: number;
	activityType: UserActivityType;
	timestamp: Date;
}

// Auth
export interface UserAuth {
	username: string;
	password: string;
}

// CRUD
export interface UpdateUser
	extends Partial<
		Pick<
			UserDetailed,
			| "username"
			| "email"
			| "name"
			| "password"
			| "role"
			| "avatar"
			| "bio"
			| "public_email"
		>
	> {}
export interface CreateUser
	extends Pick<UserDetailed, "username" | "email" | "name" | "password">,
		Partial<Pick<UserDetailed, "role" | "avatar" | "bio">> {}
