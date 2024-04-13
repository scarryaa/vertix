import { Exclude } from "class-transformer";
import {
	IsBoolean,
	IsDate,
	IsEmail,
	IsOptional,
	IsString,
	IsStrongPassword,
	Length,
	MinLength,
} from "class-validator";
import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

export enum UserRole {
	Admin = "admin",
	User = "user",
}

@Entity()
export class User {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.User,
	})
	role: UserRole;

	@CreateDateColumn()
	@IsDate()
	createdAt: Date;

	@UpdateDateColumn()
	@IsDate()
	updatedAt: Date;

	@DeleteDateColumn()
	@IsDate()
	deletedAt: Date;

	@Column({ unique: true })
	@Length(4, 20)
	@IsString()
	username: string;

	@Column({ unique: true })
	@IsEmail()
	email: string;

	@Column()
	@MinLength(8)
	@IsStrongPassword()
	@Exclude({ toPlainOnly: true })
	password: string;

	@Column()
	@IsString()
	name: string;

	@Column()
	@IsString()
	@IsOptional()
	avatar: string | undefined;

	@Column()
	@IsString()
	@IsOptional()
	bio: string | undefined;

	@Column()
	@IsString()
	@IsOptional()
	publicEmail: string | undefined;

	@Column()
	@IsBoolean()
	verifiedEmail: boolean;

	static create(params: {
		username: string;
		email: string;
		password: string;
		name: string;
		role: UserRole;
	}): User {
		const user = new User();

		user.username = params.username;
		user.email = params.email;
		user.password = params.password;
		user.name = params.name;
		user.role = params.role;

		// DomainEvents.publish(new UserCreatedEvent(user));
		return user;
	}

	update(
		username?: string,
		email?: string,
		password?: string,
		name?: string,
	): User {
		if (username) {
			this.username = username;
		}
		if (email) {
			this.email = email;
		}
		if (password) {
			this.password = password;
		}
		if (name) {
			this.name = name;
		}

		// DomainEvents.publish(new UserUpdatedEvent(this));
		return this;
	}

	// id: string;
	// role: UserRole;
	// created_at: Date;
	// updated_at: Date;

	// username: string;
	// email: string;
	// password: string;
	// name: string;
	// avatar: string | null;
	// bio: string | null;
	// public_email: string | null;
	// verified_email: boolean;
	// languages: Language[];
	// preferred_languages: Language[];
	// programming_languages: ProgrammingLanguage[];
	// timezone: Timezone;
	// status: UserStatus;

	// // Events
	// last_login_at: Date | null;
	// deleted_at: Date | null;

	// // Auth
	// reset_password_token?: string | null;
	// reset_password_expires?: Date | null;
	// two_factor_enabled: boolean;
	// phone: string | null;

	// // Extra
	// location: string | null;
	// website: string | null;
	// deleted: boolean;

	// // Relations
	// assigned_issues: IssueAssignee[];
	// social_logins: SocialLogin[];
	// repositories: RepositoryDetailed[];
	// followers: Follow[];
	// following: Follow[];
	// issues: Issue[];
	// stars: Star[];
	// collaborators: ContributorDetailed[];
	// comments: Comment[];
	// notifications: Notification[];
	// memberships: Member[];
	// pull_requests: PullRequest[];
	// pull_request_authors: PullRequest[];
	// commits: Commit[];
	// user_preferences: UserPreferences;
	// reviews: ReviewDetailed[];
}
