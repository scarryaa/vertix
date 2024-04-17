import { AggregateRoot } from ".";
import type { BaseEvent, BasePayload } from "../events";
import type {
	CreateUserPayload,
	DeleteUserPayload,
	UpdateUserPayload,
	UserEvent,
} from "../events/user.event";
import { type Snapshot, SnapshotService } from "../services/snapshot.service";

export enum UserEventType {
	UserCreatedEvent = "UserCreatedEvent",
	UserDeletedEvent = "UserDeletedEvent",
	UserUpdatedEvent = "UserUpdatedEvent",
}

enum UserRole {
	User = "User",
	Admin = "Admin",
}

const eventHandlersKey = Symbol("eventHandlers");

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
	private deletionToken!: string | null;

	private version = 0;
	private latestEventId!: string;
	private hasSnapshot = false;

	private snapshotService!: SnapshotService;

	constructor(userId: string) {
		super(userId);
		this.userId = userId;
		this.snapshotService = SnapshotService.getInstance();
	}

	async applyEvent(
		event: BaseEvent<BasePayload, UserEventType>,
		replay = false,
	) {
		const handler = this[eventHandlersKey][event.eventType as UserEventType];

		if (handler) {
			handler(event as UserEvent<any>);
		} else {
			console.warn(`No handler defined for event type ${event.eventType}`);
		}

		if (!replay) {
			this.version++;
			this.latestEventId = event.id;
			await this.createSnapshotIfNeeded();
		}
	}

	private applyUserCreatedEvent(event: { payload: CreateUserPayload }) {
		const payload = event.payload as CreateUserPayload;
		Object.assign(this, payload);
	}

	private applyUserDeletedEvent(event: { payload: DeleteUserPayload }) {
		const payload = event.payload as DeleteUserPayload;
		Object.assign(this, payload);
	}

	private applyUserUpdatedEvent(event: { payload: UpdateUserPayload }) {
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

		for (const key of validProperties) {
			if (validProperties.includes(key) && event.payload[key] !== undefined) {
				(this[key] as any) = event.payload[key];
			}
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

	private fromSnapshot(snapshot: Snapshot<this>) {
		this.id = snapshot.id;
		this.version = snapshot.version;
		this.latestEventId = snapshot.eventId;

		const data = JSON.parse(snapshot.payload.data);

		for (const key of Object.keys(data)) {
			(this as any)[key] = data[key];
		}
	}

	public toPublicObject() {
		const {
			password,
			deleted,
			version,
			updatedAt,
			createdAt,
			deletedAt,
			deletionToken,
			email,
			hasSnapshot,
			latestEventId,
			lastLogin,
			notificationSettings,
			role,
			emailVerified,
			twoFactorEnabled,
			...userPublic
		} = this;

		return userPublic;
	}

	public toPrivateObject() {
		const {
			password,
			version,
			role,
			latestEventId,
			hasSnapshot,
			...userPrivate
		} = this;

		return userPrivate;
	}

	async createSnapshotIfNeeded() {
		// Create snapshot every 50 events
		if (this.version % 50 !== 0) {
			return;
		}

		$logger.info(`Creating snapshot for user ${this.userId}`);
		const snapshot: Snapshot<this> = {
			id: this.id,
			version: this.version,
			eventId: this.latestEventId,
			eventTimestamp: new Date().toISOString(),
			payload: {
				data: JSON.stringify(this.toPrivateObject()),
			},
		};

		await this.snapshotService.saveSnapshot(snapshot);
		this.hasSnapshot = true;
		$logger.info(`Snapshot for user ${this.userId} sucessfully created`);
	}

	async applySnapshot(events: BaseEvent<BasePayload, UserEventType>[]) {
		let snapshot: Snapshot<this> | undefined | null;

		try {
			snapshot = await this.snapshotService.getSnapshot(this.userId);

			if (snapshot) {
				this.fromSnapshot(snapshot);
			}

			// Apply the rest of the events if needed
			for (const event of events.filter(
				(e) => e.createdAt.toISOString() === snapshot?.eventTimestamp,
			)) {
				this.applyEvent(event);
			}
		} catch (e) {
			$logger.warn(`Could not get snapshot for user ${this.userId}`);
			$logger.error(e);
		}
	}

	public isDeleted(): boolean {
		return this.deleted;
	}

	public getPassword(): string {
		return this.password;
	}

	public getHasSnapshot(): boolean {
		return this.hasSnapshot;
	}

	public async getSnapshot(): Promise<Snapshot<this> | null> {
		return await this.snapshotService.getSnapshot(this.id);
	}

	// Deletion token management
	public setDeletionToken(token: string): void {
		this.deletionToken = token;
	}

	public clearDeletionToken(): void {
		this.deletionToken = null;
	}

	public validateDeletionToken(token: string): boolean {
		return this.deletionToken === token;
	}
}
