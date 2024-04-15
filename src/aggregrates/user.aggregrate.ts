import { AggregateRoot } from ".";
import type { BaseEvent, BasePayload } from "../events";
import type {
	CreateUserPayload,
	DeleteUserPayload,
	UpdateUserPayload,
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

	public applyUserUpdatedEvent(event: { payload: UpdateUserPayload }) {
		this.userId = event.payload.userId;

		if (event.payload.username) {
			this.username = event.payload.username;
		}

		if (event.payload.password) {
			this.password = event.payload.password;
		}

		if (event.payload.email) {
			this.email = event.payload.email;
		}

		if (event.payload.name) {
			this.name = event.payload.name;
		}

		$logger.info(`Updated user ${this.userId}`);
	}

	applyEvent(event: BaseEvent<BasePayload>) {
		switch (event.eventType) {
			case "UserCreated": {
				const createUserEvent = event as UserEvent<CreateUserPayload>;
				this.applyUserCreatedEvent(createUserEvent);
				break;
			}
			case "UserDeleted": {
				const deleteUserEvent = event as UserEvent<DeleteUserPayload>;
				this.applyUserDeletedEvent(deleteUserEvent);
				break;
			}
			case "UserUpdated": {
				const updateUserEvent = event as UserEvent<UpdateUserPayload>;
				this.applyUserUpdatedEvent(updateUserEvent);
				break;
			}
		}
	}

	public isDeleted(): boolean {
		return this.deleted;
	}
}
