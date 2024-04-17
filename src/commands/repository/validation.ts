import {
	type RepositoryAggregate,
	RepositoryEventType,
} from "../../aggregrates/repository.aggregate";
import type { EventEntity } from "../../entities/Event";
import { AlreadyExistsError } from "../../errors/already-exists.error";
import { DoesNotExistError } from "../../errors/does-not-exist.error";
import type { EventStore } from "../../events/store.event";
import type { CreateRepositoryCommand } from "./handlers/create-repository.command";

export const ensureRepositoryDoesNotExist =
	(eventStore: EventStore) => async (command: CreateRepositoryCommand) => {
		const existingRepositories = await findRepositoriesByNameAndAuthorId(
			eventStore,
		)(command.name, command.authorId);

		// Throw error if repository already exists and hasn't been renamed
		if (existingRepositories.length > 0) {
			const { wasRenamed, event } = await checkIfRepositoryWasRenamed(
				eventStore,
			)(existingRepositories, command.name);

			// Throw error if repository was not renamed
			if (!wasRenamed) {
				throwAlreadyExistsError(command.name)();
			}

			// Throw error if repository was renamed and the new name already exists,
			// but ignore if the new name is the same as the old name
			if (command.name !== event?.payload.name) {
				throwAlreadyExistsError(command.name)();
			}
		}
	};

export const ensureRepositoryDoesExist =
	(eventStore: EventStore) => async (name: string, authorId: string) => {
		const existingRepositories = await findRepositoriesByNameAndAuthorId(
			eventStore,
		)(name, authorId);

		if (existingRepositories.length === 0) {
			throwDoesNotExistError(name)();
		}
	};

export const findRepositoriesByNameAndAuthorId =
	(eventStore: EventStore) => (name: string, authorId: string) => {
		return eventStore.queryIndex({
			payloadMatches: { name, authorId },
		});
	};

export const checkIfRepositoryWasRenamed =
	(eventStore: EventStore) =>
	async (
		repositories: EventEntity<RepositoryAggregate>[],
		newName: string,
	): Promise<{
		wasRenamed: boolean;
		event: EventEntity<RepositoryAggregate> | null;
	}> => {
		for (const repo of repositories) {
			const renameEvents = await eventStore.queryIndex<RepositoryAggregate>({
				aggregateId: repo.aggregateId,
				eventType: RepositoryEventType.RepositoryUpdatedEvent,
				limit: 1,
			});

			if (
				renameEvents.length === 0 ||
				renameEvents[0]?.payload.name === newName
			) {
				return {
					wasRenamed: false,
					event: repo,
				};
			}
		}
		return {
			wasRenamed: true,
			event: null,
		};
	};

export const throwAlreadyExistsError = (name: string) => (error?: Error) => {
	throw new AlreadyExistsError(
		`Repository with name ${name} already exists.${
			error ? ` ${error.message}` : ""
		}`,
	);
};

export const throwDoesNotExistError = (name: string) => (error?: Error) => {
	throw new DoesNotExistError(
		`Repository with name ${name} does not exist.${
			error ? ` ${error.message}` : ""
		}`,
	);
};
