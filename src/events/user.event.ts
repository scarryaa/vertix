import { BaseEvent, type BasePayload } from ".";
import { generateUuid } from "../util";

export interface CreateUserPayload extends BasePayload {
	userId: string;
	username: string;
	password: string;
	email: string;
	name: string;
}

export interface DeleteUserPayload extends BasePayload {
	userId: string;
}

export class UserEvent<
	T extends CreateUserPayload | DeleteUserPayload,
> extends BaseEvent<T> {}
