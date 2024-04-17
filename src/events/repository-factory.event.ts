import { RepositoryEventType } from "../aggregrates/repository.aggregate";
import { generateUuid } from "../util";
import {
	type CreateRepositoryPayload,
	RepositoryEvent,
	type UpdateRepositoryPayload,
} from "./repository.event";

// biome-ignore lint/complexity/noStaticOnlyClass: Needed for factory
export class RepositoryEventFactory {
	static createRepositoryEvent(
		payload: CreateRepositoryPayload,
	): RepositoryEvent<CreateRepositoryPayload> {
		const aggregateId = payload.id;
		const id = generateUuid();
		const eventType = RepositoryEventType.RepositoryCreatedEvent;

		return new RepositoryEvent<CreateRepositoryPayload>(
			aggregateId,
			id,
			eventType,
			payload,
		);
	}

	static updateRepositoryEvent(
		payload: UpdateRepositoryPayload,
	): RepositoryEvent<UpdateRepositoryPayload> {
		const aggregateId = payload.id;
		const id = generateUuid();
		const eventType = RepositoryEventType.RepositoryUpdatedEvent;

		return new RepositoryEvent<UpdateRepositoryPayload>(
			aggregateId,
			id,
			eventType,
			payload,
		);
	}
}
