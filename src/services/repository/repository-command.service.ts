import { randomUUID } from "node:crypto";
import type { DomainEventEmitter } from "../../events/event-emitter.events";
import type { EventStore } from "../../events/event-store.events";
import { FileCreateFailedEvent } from "../../events/file.event";
import { GenericErrorEvent } from "../../events/generic.events";
import { RepositoryCreateFailedEvent } from "../../events/repository.events";
import type { RepositoryDetailed } from "../../models";
import type { RepositoryBasicRepository } from "../../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../../repositories/repository-detailed.repository";
import {
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
} from "../../utils/errors";
import { UserDoesNotExistError } from "../../utils/errors/user.error";
import type { Validator } from "../../validators/service-layer/base.validator";
import { Validate } from "../../validators/service-layer/decorators";
import { ValidationAction } from "../base-repository.service";
import type { FileService } from "../file/file.service";
import type { User, UserService } from "../user.service";
import {
	CreateRepositoryCommand,
	DeleteRepositoryCommand,
	UpdateRepositoryCommand,
} from "./commands";
import { CreateRepositoryCommandHandler } from "./create-repository-command-handler.service";
import { DeleteRepositoryCommandHandler } from "./delete-repository-command-handler.service";
import type { RepositoryAuthorizationService } from "./repository-authorization.service";
import type { RepositoryFetchService } from "./repository-fetch.service";
import type { RepositoryValidationService } from "./repository-validation.service";
import type { Repository } from "./types";
import { UpdateRepositoryCommandHandler } from "./update-repository-command-handler.service";

export interface CreateRepositoryParams {
	repository: Partial<Repository>;
	description: string;
	authToken: string;
}

export interface UpdateRepositoryParams {
	repositoryId: string;
	changes: Partial<Repository>;
	userId: string;
	authToken: string;
}

export interface DeleteRepositoryParams {
	repositoryId: string;
	userId: string;
	authToken: string;
}

export type RepositoryCommandServiceConfig = {
	repositoryBasicRepository: RepositoryBasicRepository;
	repositoryDetailedRepository: RepositoryDetailedRepository;
};

export type RepositoryCommandServiceServices = {
	repositoryFetchService: RepositoryFetchService;
	userService: UserService;
	fileService: FileService;
	repositoryAuthzService: RepositoryAuthorizationService;
	repositoryValidationService: RepositoryValidationService;
	eventEmitter: DomainEventEmitter;
	eventStore: EventStore;
};

// @TODO break methods/this down further
export class RepositoryCommandService {
	public userService: UserService;
	public repositoryBasicRepository: RepositoryBasicRepository;
	public repositoryDetailedRepository: RepositoryDetailedRepository;
	public repositoryAuthzService: RepositoryAuthorizationService;
	public repositoryFetchService: RepositoryFetchService;
	public repositoryValidationService: RepositoryValidationService;
	public userValidationService: Validator<User>;
	public domainEventEmitter: DomainEventEmitter;
	public eventStore: EventStore;

	constructor(
		private readonly _config: RepositoryCommandServiceConfig,
		private readonly _services: RepositoryCommandServiceServices,
	) {
		this.userService = _services.userService;
		this.repositoryBasicRepository = _config.repositoryBasicRepository;
		this.repositoryDetailedRepository = _config.repositoryDetailedRepository;
		this.repositoryAuthzService = _services.repositoryAuthzService;
		this.repositoryFetchService = _services.repositoryFetchService;
		this.repositoryValidationService = _services.repositoryValidationService;
		this.userValidationService = _services.userService.validator;
		this.domainEventEmitter = _services.eventEmitter;
		this.eventStore = _services.eventStore;
		this._config = _config;
	}

	@Validate<Repository>(ValidationAction.CREATE, "RepositoryValidator", {
		requiredFields: ["name", "visibility"],
		supportedFields: ["description", "visibility", "name"],
		entityDataIndex: 0,
		requireAllFields: true, // All fields required for create
	})
	async create(
		repositoryData: Pick<Repository, "name" | "visibility" | "description" | "id">,
		authToken: string,
	): Promise<void> {
		const command = new CreateRepositoryCommand(repositoryData, authToken);
		const handler = new CreateRepositoryCommandHandler(this);
		await handler.handle(command);
	}

	async delete(
		repositoryId: string,
		ownerId: string | undefined,
		authToken: string,
	): Promise<void> {
		const command = new DeleteRepositoryCommand(
			repositoryId,
			ownerId,
			authToken,
		);
		const handler = new DeleteRepositoryCommandHandler(this);
		await handler.handle(command);
	}

	@Validate<Repository>(ValidationAction.UPDATE, "RepositoryValidator", {
		requiredFields: ["description", "name", "ownerId", "visibility"],
		supportedFields: ["description", "name", "ownerId", "visibility"],
		entityDataIndex: 1,
		requireAllFields: false,
		requireAtLeastOneField: true,
	})
	async update(
		repositoryId: string,
		entityData: Partial<Repository>,
		ownerId: string | undefined,
		authToken: string,
	): Promise<void> {
		let _ownerId: string | undefined;

		if (!ownerId) {
			_ownerId = await this.repositoryAuthzService.authenticateUser(authToken);
		}
		const command = new UpdateRepositoryCommand(
			repositoryId,
			entityData,
			ownerId ?? ownerId!,
			authToken,
		);
		const handler = new UpdateRepositoryCommandHandler(this);
		await handler.handle(command);
	}

	public async handleCommandError(
		error: unknown,
		repositoryData: Partial<Repository> | undefined,
		authToken?: string,
	): Promise<void> {
		let errorEvent: RepositoryCreateFailedEvent | GenericErrorEvent<unknown>;
		let userId: string | undefined;
		if (authToken)
			userId = await this.repositoryAuthzService.authenticateUser(authToken);

		const baseEventInfo = {
			id: randomUUID(),
			timestamp: new Date(),
			repositoryData: {
				name: repositoryData?.name!,
				repositoryId: repositoryData?.id,
				ownerId: repositoryData?.ownerId!,
				description: repositoryData?.description,
				visibility: repositoryData?.visibility,
			},
			userId: userId,
		};

		if (error instanceof RepositoryAlreadyExistsError) {
			errorEvent = new RepositoryCreateFailedEvent(
				baseEventInfo.id,
				baseEventInfo.timestamp,
				{
					data: repositoryData,
					errorCode: "RepositoryAlreadyExists",
					message: error.message,
				},
				"RepositoryAlreadyExists",
				error.message,
				userId,
			);
		} else if (error instanceof UserDoesNotExistError) {
			errorEvent = new RepositoryCreateFailedEvent(
				baseEventInfo.id,
				baseEventInfo.timestamp,
				{
					data: repositoryData,
					errorCode: "RepositoryAlreadyExists",
					message: error.message,
				},
				"UserDoesNotExist",
				error.message,
				userId,
			);
		} else if (error instanceof FileCreateFailedEvent) {
			errorEvent = new RepositoryCreateFailedEvent(
				baseEventInfo.id,
				baseEventInfo.timestamp,
				{
					data: repositoryData,
					errorCode: "RepositoryAlreadyExists",
					message: error.message,
				},
				"FileCreateFailed",
				error.message,
				userId,
			);
		} else {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			errorEvent = new GenericErrorEvent(
				baseEventInfo.id,
				baseEventInfo.timestamp,
				{
					errorCode: "RepositoryCreationAttempt",
					message: errorMessage,
					data: repositoryData,
				},
				"RepositoryCreationAttempt",
			);
		}

		await this.eventStore.queueEventForProcessing(errorEvent);
		this.domainEventEmitter.emit(errorEvent.constructor.name, errorEvent);
		console.error(error);
	}

	public async performRepositoryChecks(
		operation: "create" | "update" | "delete",
		repositoryData: Partial<Repository>,
		userData: Partial<User> | null,
	): Promise<void> {
		const serviceName = this.constructor.name;

		switch (operation) {
			case "create": {
				// Verify that userId is defined
				// and that the repository does NOT exist
				// and that the user DOES exist
				await this.repositoryValidationService.verifyUserAndRepositoryConditions(
					userData?.id,
					repositoryData.id,
					false,
				);

				// verifying username and repository name
				this.userValidationService.verifyPropertyIsDefined(
					userData?.username,
					"username",
					serviceName,
				);
				this.repositoryValidationService.verifyPropertyIsDefined(
					repositoryData.name,
					"name",
					serviceName,
				);

				// Verify that the repository name is not taken
				await this.repositoryValidationService.checkEntityExistence(
					this.repositoryBasicRepository,
					{ AND: [{ name: repositoryData.name, ownerId: userData?.id }] },
					false,
					new RepositoryNotFoundError(),
					new RepositoryAlreadyExistsError(),
					serviceName,
				);

				break;
			}
			case "update": {
				// Verify that userId and repositoryId are defined
				// AND that the repository DOES exist
				// AND that the user DOES exist
				await this.repositoryValidationService.verifyUserAndRepositoryConditions(
					userData?.id,
					repositoryData.id,
					true,
				);
				this.repositoryValidationService.verifyPropertyIsDefined(
					repositoryData.id,
					"id",
					serviceName,
				);

				const repository =
					(await this.repositoryFetchService.getRepositoryOrThrow(
						// We already verified that the repositoryId is defined
						repositoryData.id!,
						true,
					)) as RepositoryDetailed;

				// Verify user is owner or contributor of repository
				await this.repositoryAuthzService.throwIfNotRepositoryOwnerOrContributor(
					// We already verified that the userId is defined
					userData?.id!,
					// Need detailed repo @TODO double check this
					repository,
				);

				// Check if name is already taken by owner (if name is being updated)
				if (repositoryData.name && repositoryData.name !== repository.name) {
					await this.repositoryValidationService.checkEntityExistence(
						this.repositoryBasicRepository,
						{
							AND: [{ name: repositoryData.name }, { ownerId: userData?.id }],
						},
						false,
						new RepositoryNotFoundError(),
						new RepositoryAlreadyExistsError(),
						serviceName,
					);
				}
				break;
			}
			case "delete": {
				// Verify that the repository DOES exist
				// AND that the user DOES exist
				// AND that the user id is defined
				// AND that the repository id is defined
				await this.repositoryValidationService.verifyUserAndRepositoryConditions(
					userData?.id,
					repositoryData.id,
					true,
				);
				this.repositoryValidationService.verifyPropertyIsDefined(
					repositoryData.id,
					"id",
					serviceName,
				);

				break;
			}
		}
	}

	public async authenticateAndAuthorize(
		authToken: string,
		repositoryId?: string,
		action: "create" | "update" | "delete" = "create",
	): Promise<string> {
		const userId =
			await this.repositoryAuthzService.authenticateUser(authToken);
		if (repositoryId) {
			const repository =
				(await this.repositoryFetchService.getRepositoryOrThrow(
					repositoryId,
					true,
				)) as RepositoryDetailed;
			switch (action) {
				case "update":
					await this.repositoryAuthzService.throwIfNotRepositoryOwnerOrContributor(
						userId,
						repository,
					);
					break;
				case "delete":
					await this.repositoryAuthzService.throwIfNotRepositoryOwner(
						userId,
						repository.ownerId,
					);
					break;
			}
		}
		return userId;
	}
}
