import { BaseEvent, type BasePayload } from ".";

export interface CreateRepositoryPayload extends BasePayload {
	id: string;
	name: string;
	description?: string;
	private?: boolean;
	authorId: string;
}

export interface DeleteRepositoryPayload extends BasePayload {
	id: string;
}

export interface UpdateRepositoryPayload extends BasePayload {
	id: string;
	name?: string;
	description?: string;
	private?: boolean;
}

export class RepositoryEvent<
	T extends
		| CreateRepositoryPayload
		| DeleteRepositoryPayload
		| UpdateRepositoryPayload,
	// @TODO improve this
> extends BaseEvent<T, any> {}
