import { AggregateRoot } from ".";
import type {
	CreateUserPayload,
	DeleteUserPayload,
	UserEvent,
} from "../events/user.event";

export class UserAggregate extends AggregateRoot {
	private userId!: string;
	private username!: string;
	private password!: string;
	private email!: string;
	private name!: string;
	private deleted!: boolean;

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

	public applyEvent<T extends CreateUserPayload & DeleteUserPayload>(
		event: UserEvent<T>,
	): void {
		switch (event.eventType) {
			case "UserCreatedEvent":
				this.applyUserCreatedEvent(event);
				break;
			case "UserDeletedEvent":
				this.applyUserDeletedEvent(event);
				break;
			default:
				break;
		}
	}

	public isDeleted(): boolean {
		return this.deleted;
	}
}
