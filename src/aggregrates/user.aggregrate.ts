import { AggregateRoot } from ".";
import type { BaseEvent, BasePayload } from "../events";
import type {
	CreateUserPayload,
	DeleteUserPayload,
	UpdateUserPayload,
	UserEvent,
} from "../events/user.event";

export enum UserEventType {
	UserCreatedEvent = "UserCreatedEvent",
	UserDeletedEvent = "UserDeletedEvent",
	UserUpdatedEvent = "UserUpdatedEvent",
}

enum UserRole {
	User = "User",
	Admin = "Admin",
}

const eventHandlersKey = Symbol('eventHandlers');

export class UserAggregate extends AggregateRoot {
	private userId!: string;
	private username!: string;
	private password!: string;
	private email!: string;
	private name!: string;
	private deleted!: boolean;
	private deletedAt!: Date | null;
	private bio!: string;
	private publicEmail!: string;
	private avatarUrl!: string;
	private websiteUrl!: string;
	private followers!: string[];
	private following!: string[];
	private starred!: string[];
	private lastLogin!: Date;
	private createdAt!: Date;
	private updatedAt!: Date;
	private twoFactorEnabled!: boolean;
	private emailVerified!: boolean;
	private notificationSettings!: string[];
	private repositories!: string[];
	private contributions!: string[];
	private role!: UserRole;
	private statusMessage!: string;
	private timezone!: string;
	private phoneNumber!: string;

	public applyUserCreatedEvent(event: { payload: CreateUserPayload }) {
		this.userId = event.payload.userId;
		this.username = event.payload.username;
		this.password = event.payload.password;
		this.email = event.payload.email;
		this.name = event.payload.name;
	}

	public applyUserDeletedEvent(event: { payload: DeleteUserPayload }) {
		this.userId = event.payload.userId;
		this.deleted = true;
	}

	public applyUserUpdatedEvent(event: { payload: UpdateUserPayload }) {
		this.throwIfDeleted();
		const validProperties: (keyof Omit<UpdateUserPayload, "userId">)[] = [
			"username",
			"websiteUrl",
			"bio",
			"publicEmail",
			"avatarUrl",
			"followers",
			"following",
			"starred",
			"twoFactorEnabled",
			"emailVerified",
			"notificationSettings",
			"repositories",
			"contributions",
			"statusMessage",
			"timezone",
			"phoneNumber",
			"role",
		];

		// Filter out 'userId' from the keys of event.payload
		const keys = (
			Object.keys(event.payload) as Array<keyof UpdateUserPayload>
		).filter((key) => key !== "userId");

		for (const key of keys) {
			if (
				validProperties.includes(key as keyof Omit<UpdateUserPayload, "userId">)
			) {
				if (event.payload[key] !== undefined) {
					(this[key] as any) = event.payload[key];
				}
			}
		}
	}

	applyEvent(event: BaseEvent<BasePayload>) {
		const handler = this[eventHandlersKey][event.eventType as UserEventType];
		if (handler) {
			handler(event as UserEvent<any>);
		} else {
			console.warn(`No handler defined for event type ${event.eventType}`);
		}
	}

	private [eventHandlersKey] = {
		[UserEventType.UserCreatedEvent]: (event: UserEvent<CreateUserPayload>) =>
			this.applyUserCreatedEvent(event),
		[UserEventType.UserDeletedEvent]: (event: UserEvent<DeleteUserPayload>) =>
			this.applyUserDeletedEvent(event),
		[UserEventType.UserUpdatedEvent]: (event: UserEvent<UpdateUserPayload>) =>
			this.applyUserUpdatedEvent(event),
	};

	private throwIfDeleted() {
		if (this.deleted) {
			throw new Error("User is deleted.");
		}
	}

	public toPublicObject() {
		return {
			id: this.userId,
			username: this.username,
			name: this.name,
			bio: this.bio,
			publicEmail: this.publicEmail,
			avatarUrl: this.avatarUrl,
			websiteUrl: this.websiteUrl,
			followers: this.followers,
			following: this.following,
			twoFactorEnabled: this.twoFactorEnabled,
			emailVerified: this.emailVerified,
			repositories: this.repositories,
			contributions: this.contributions,
			statusMessage: this.statusMessage,
			timezone: this.timezone,
		};
	}

	public toPrivateObject() {
		this.throwIfDeleted();

		return {
			id: this.id,
			userId: this.userId,
			username: this.username,
			name: this.name,
			bio: this.bio,
			publicEmail: this.publicEmail,
			avatarUrl: this.avatarUrl,
			websiteUrl: this.websiteUrl,
			followers: this.followers,
			following: this.following,
			starred: this.starred,
			notificationSettings: this.notificationSettings,
			twoFactorEnabled: this.twoFactorEnabled,
			emailVerified: this.emailVerified,
			repositories: this.repositories,
			contributions: this.contributions,
			statusMessage: this.statusMessage,
			timezone: this.timezone,
			phoneNumber: this.phoneNumber,
			role: this.role,
		};
	}

	public isDeleted(): boolean {
		return this.deleted;
	}

	public getPassword(): string {
		return this.password;
	}
}
