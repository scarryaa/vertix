import { BaseEvent, type BasePayload } from ".";

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

export interface UpdateUserPayload extends BasePayload {
	userId: string;
	username?: string;
	password?: string;
	email?: string;
	name?: string;
}

export class UserEvent<
	T extends CreateUserPayload | DeleteUserPayload | UpdateUserPayload,
> extends BaseEvent<T> {}
