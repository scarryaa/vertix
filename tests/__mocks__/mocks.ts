import type { Commit, PrismaClient } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { type DeepMockProxy, mockDeep } from "jest-mock-extended";
import { Authenticator } from "../../src/authenticators/service-layer/base.authenticator";
import {
	type Comment,
	type ContributorDetailed,
	type Issue,
	type IssueAssignee,
	IssueStatus,
	Language,
	type PullRequest,
	PullRequestStatus,
	type RepositoryBasic,
	type RepositoryDetailed,
	type ReviewDetailed,
	type Star,
	Timezone,
	type UserDetailed,
	UserRole,
	UserStatus,
} from "../../src/models";
import type { User } from "../../src/services/user.service";
import {
	type ValidationResult,
	Validator,
} from "../../src/validators/service-layer/base.validator";

export class MockAuthenticator extends Authenticator {
	constructor(private _secretKey: string) {
		super(_secretKey);
		this._secretKey = _secretKey;
	}

	authenticate(
		authToken: string,
		roles: UserRole[],
	): { user_id: number; role: UserRole } {
		return { user_id: 1, role: UserRole.USER };
	}
}

export class MockValidator extends Validator<unknown> {
	validate(data: unknown): ValidationResult<unknown> {
		return {
			errorMessage: undefined,
			isValid: true,
			missingRequiredFields: [],
			unsupportedFields: [],
		};
	}
}

export const mockRequest = {} as unknown as FastifyRequest;
export const mockReply = {
	status: jest.fn().mockReturnThis(),
	send: jest.fn(),
	setCookie: jest.fn(),
	clearCookie: jest.fn(),
	jwtSign: jest.fn(() => "mocked-token"),
} as unknown as FastifyReply;

// Prisma

export type Context = {
	prisma: PrismaClient;
};

export type MockContext = {
	prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): MockContext => {
	return {
		prisma: mockDeep<PrismaClient>(),
	};
};

// bcrypt

export const mockBcrypt = {
	hash: jest.fn(() => "hashed-password"),
	compare: jest.fn(),
};

// Helpers

export const generateRepository = (
	override: Partial<RepositoryBasic> = {},
): RepositoryBasic => ({
	id: 1,
	name: "Test Repo",
	visibility: "public",
	owner_id: 1,
	created_at: new Date(),
	updated_at: new Date(),
	description: "Test Description",
	...override,
});

export const generateUser = (override: Partial<User> = {}): User => ({
	id: 1,
	name: "Test User",
	email: "email@example.com",
	password: "password",
	role: UserRole.USER,
	created_at: new Date(),
	updated_at: new Date(),
	avatar: null,
	bio: null,
	public_email: null,
	location: null,
	phone: null,
	two_factor_enabled: false,
	website: null,
	username: "test-user",
	deleted: false,
	deleted_at: null,
	verified_email: false,
	languages: [],
	programming_languages: [],
	assigned_issues: [],
	collaborators: [],
	comments: [],
	commits: [],
	followers: [],
	following: [],
	issues: [],
	memberships: [],
	notifications: [],
	preferred_languages: [Language.ENGLISH],
	status: UserStatus.ACTIVE,
	last_login_at: null,
	reset_password_token: null,
	reset_password_expires: null,
	pull_request_authors: [],
	pull_requests: [],
	reviews: [],
	social_logins: [],
	stars: [],
	timezone: Timezone.AEDT,
	repositories: [],
	user_preferences: {
		id: 1,
		show_public_email: false,
		theme: "light",
		user_id: 1,
		user: {
			avatar: null,
			bio: null,
			created_at: new Date(),
			deleted: false,
			deleted_at: null,
			email: "email@example.com",
			id: 1,
			name: "Test User",
			password: "password",
			public_email: null,
			repositories: [],
			role: UserRole.USER,
			updated_at: new Date(),
			username: "test-username",
		},
	},
	...override,
});

export const generateUserDetailed = (
	override: Partial<UserDetailed> = {},
): UserDetailed => ({
	id: 1,
	role: UserRole.USER,
	created_at: new Date(),
	updated_at: new Date(),
	username: "test-user",
	email: "email@example.com",
	password: "password",
	name: "Test User",
	avatar: null,
	bio: null,
	public_email: null,
	verified_email: false,
	languages: [],
	preferred_languages: [Language.ENGLISH],
	programming_languages: [],
	timezone: Timezone.AEDT,
	status: UserStatus.ACTIVE,
	last_login_at: null,
	reset_password_token: null,
	reset_password_expires: null,
	two_factor_enabled: false,
	phone: null,
	location: null,
	website: null,
	deleted: false,
	deleted_at: null,
	assigned_issues: [],
	collaborators: [],
	comments: [],
	commits: [],
	followers: [],
	following: [],
	issues: [],
	memberships: [],
	notifications: [],
	pull_request_authors: [],
	pull_requests: [],
	reviews: [],
	social_logins: [],
	stars: [],
	repositories: [],
	user_preferences: {
		id: 1,
		show_public_email: false,
		theme: "light",
		user_id: 1,
		user: {
			id: 1,
			name: "Test User",
			email: "email",
			password: "password",
			role: UserRole.USER,
			created_at: new Date(),
			updated_at: new Date(),
			avatar: null,
			bio: null,
			public_email: null,
			repositories: [],
			deleted: false,
			deleted_at: null,
			username: "test-user",
		},
	},
	...override,
});

export const generateRepositoryDetailed = (
	override: Partial<RepositoryDetailed> = {},
): RepositoryDetailed => ({
	id: 1,
	name: "Test Repo",
	description: "Test Description",
	visibility: "public",
	created_at: new Date(),
	updated_at: new Date(),
	owner: {
		...generateUser(),
	},
	owner_id: 1,
	issues: [],
	stars: [],
	programming_languages: [],
	contributors: [],
	license: null,
	license_id: null,
	tag: null,
	tag_id: null,
	organization: null,
	organization_id: null,
	pull_requests: [],
	...override,
});

export const generatePullRequest = (
	override: Partial<PullRequest> = {},
): PullRequest => ({
	id: 1,
	title: "Test Pull Request",
	description: "Test Description",
	authorId: 1,
	base_branch: "test-branch",
	closed_at: null,
	commits: [],
	head_branch: "test-branch",
	merged_at: null,
	pull_request_assignees: [],
	reviews: [],
	status: PullRequestStatus.OPEN,
	created_at: new Date(),
	updated_at: new Date(),
	repository: {
		...generateRepositoryDetailed(),
	},
	repository_id: 1,
	author: {
		...generateUser(),
	},
	comments: [],
	...override,
});

export const generateComment = (override: Partial<Comment> = {}): Comment => ({
	body: "Test Comment",
	created_at: new Date(),
	updated_at: new Date(),
	author: {
		...generateUser(),
	},
	author_id: 1,
	issue: {
		...generateIssue(),
	},
	issue_id: 1,
	pull_request: {
		...generatePullRequest(),
	},
	pull_request_id: 1,
	deleted_user: false,
	id: 1,
	...override,
});

export const generateIssue = (override: Partial<Issue> = {}): Issue => ({
	id: 1,
	title: "Test Issue",
	assignees: [],
	status: IssueStatus.OPEN,
	body: "Body Issue",
	created_at: new Date(),
	updated_at: new Date(),
	repository: {
		...generateRepositoryDetailed(),
	},
	repository_id: 1,
	author: {
		...generateUser(),
	},
	author_id: 1,
	comments: [],
	...override,
});

export const generateIssueAssignee = (
	override: Partial<IssueAssignee> = {},
): IssueAssignee => ({
	id: 1,
	issue: {
		...generateIssue(),
	},
	issue_id: 1,
	user: {
		...generateUser(),
	},
	user_id: 1,
	...override,
});

export const generateReview = (
	override: Partial<ReviewDetailed> = {},
): ReviewDetailed => ({
	id: 1,
	body: "Test Review",
	created_at: new Date(),
	updated_at: new Date(),
	author: {
		...generateUser(),
	},
	author_id: 1,
	pull_request_id: 1,
	pull_request: [],
	...override,
});

export const generateContributorDetailed = (
	override: Partial<ContributorDetailed> = {},
): ContributorDetailed => ({
	id: 1,
	repository: generateRepositoryDetailed(),
	repository_id: 1,
	user: generateUserDetailed(),
	user_id: 1,
});

export const generateCommit = (override: Partial<Commit> = {}): Commit => ({
	author_id: 1,
	created_at: new Date(),
	id: 1,
	message: "Commit Message",
	pull_request_id: 1,
	sha: "SHA",
});

export const generateStar = (override: Partial<Star> = {}): Star => ({
	id: 1,
	user_id: 1,
	repository_id: 1,
	created_at: new Date(),
	updated_at: new Date(),
	...override,
});
