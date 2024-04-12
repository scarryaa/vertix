import type { DomainEvent } from "../../events/domain.event";
import type { RepositoryEvent } from "../../events/repository.events";

export class ReadModelError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export const isRepositoryEvent = (
	event: DomainEvent,
): event is RepositoryEvent<any> => {
	return [
		"RepositoryCreated",
		"RepositoryUpdated",
		"RepositoryDeleted",
		"RepositoryCreateFailed",
		"RepositoryUpdateFailed",
		"RepositoryDeleteFailed",
	].includes(event.type);
};
