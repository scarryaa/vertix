import { BaseEvent, type BasePayload } from ".";
import type { UserEventType } from "../aggregrates/user.aggregate";

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
	bio?: string;
	publicEmail?: string;
	avatarUrl?: string;
	websiteUrl?: string;
	followers?: number;
	following?: number;
	starred?: boolean;
	twoFactorEnabled?: boolean;
	emailVerified?: boolean;
	notificationSettings?: string[];
	repositories?: string[];
	contributions?: number;
	statusMessage?: string;
	timezone?: string;
	phoneNumber?: string;
	role?: string;
}

export class UserEvent<
	T extends CreateUserPayload | DeleteUserPayload | UpdateUserPayload,
> extends BaseEvent<T, UserEventType> {}
