import { UserEventType } from "../aggregrates/user.aggregrate";
import { generateUuid } from "../util";
import {
	type CreateUserPayload,
	type DeleteUserPayload,
	type UpdateUserPayload,
	UserEvent,
} from "./user.event";

// biome-ignore lint/complexity/noStaticOnlyClass: Need for factory
export class UserEventFactory {
	static createUserEvent(
		payload: CreateUserPayload,
	): UserEvent<CreateUserPayload> {
		const aggregrateId = payload.userId;
		const id = generateUuid();
		const eventType = UserEventType.UserCreatedEvent;
		return new UserEvent<CreateUserPayload>(
			aggregrateId,
			id,
			eventType,
			payload,
		);
	}

	static deleteUserEvent(
		payload: DeleteUserPayload,
	): UserEvent<DeleteUserPayload> {
		const aggregrateId = payload.userId;
		const id = generateUuid();
		const eventType = UserEventType.UserDeletedEvent;
		const deletionPayload: DeleteUserPayload = { userId: payload.userId };
		return new UserEvent<DeleteUserPayload>(
			aggregrateId,
			id,
			eventType,
			deletionPayload,
		);
	}

	static updateUserEvent(
		payload: UpdateUserPayload,
	): UserEvent<UpdateUserPayload> {
		const aggregrateId = payload.userId;
		const id = generateUuid();
		const eventType = UserEventType.UserUpdatedEvent;
		return new UserEvent<UpdateUserPayload>(
			aggregrateId,
			id,
			eventType,
			payload,
		);
	}
}
