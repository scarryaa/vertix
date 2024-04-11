import { randomUUID } from "node:crypto";
import type { DomainEventEmitter } from "../../events/event-emitter.events";
import type { EventStore } from "../../events/event-store.events";
import { FileCreateFailedEvent } from "../../events/file.event";
import { GenericErrorEvent } from "../../events/generic.events";
import {
	RepositoryCreateFailedEvent,
	RepositoryCreatedEvent,
	RepositoryDeletedEvent,
	RepositoryUpdatedEvent,
} from "../../events/repository.events";
import type { RepositoryBasic, RepositoryDetailed } from "../../models";
import type { RepositoryBasicRepository } from "../../repositories/repository-basic.repository";
import type { RepositoryDetailedRepository } from "../../repositories/repository-detailed.repository";
import { Session } from "../../session/index.session";
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
import type { RepositoryAuthorizationService } from "./repository-authorization.service";
import type { RepositoryFetchService } from "./repository-fetch.service";
import type { RepositoryValidationService } from "./repository-validation.service";
import type { Repository } from "./types";

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
	private userService: UserService;
	private repositoryBasicRepository: RepositoryBasicRepository;
	private repositoryDetailedRepository: RepositoryDetailedRepository;
	private repositoryAuthzService: RepositoryAuthorizationService;
	private repositoryFetchService: RepositoryFetchService;
	private repositoryValidationService: RepositoryValidationService;
	private userValidationService: Validator<User>;
	private domainEventEmitter: DomainEventEmitter;
	private eventStore: EventStore;

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
	async createRepositoryWithFile(
		repositoryData: Pick<Repository, "name" | "visibility" | "description">,
		fileContent: unknown,
		authToken: string,
	): Promise<RepositoryBasic> {
		try {
			return await this.repositoryBasicRepository.executeInTransaction(
				async (transactionPrisma) => {
					const loggedInUserId = await this.authenticateAndAuthorize(
						authToken,
						undefined,
						"create",
					);
					const userInfo = await this.userService.getById(loggedInUserId);

					await this.performRepositoryChecks(
						"create",
						repositoryData,
						userInfo,
					);

					const validatedUsername = userInfo?.username!;

					const newRepository = await transactionPrisma.repository.create({
						data: {
							...repositoryData,
							name: repositoryData.name,
							owner_id: loggedInUserId,
						},
						select: {
							id: true,
							name: true,
							visibility: true,
							description: true,
							owner: {
								select: {
									id: true,
									username: true,
								},
							},
						},
					});

					const event = new RepositoryCreatedEvent(randomUUID(), new Date(), {
						...newRepository,
						repositoryId: newRepository.id,
						ownerId: loggedInUserId,
						ownerName: newRepository.owner.username,
					});
					this.domainEventEmitter.emit("RepositoryCreated", event);

					return {
						...newRepository,
						owner_id: loggedInUserId,
						created_at: event.timestamp,
						updated_at: event.timestamp,
					};
				},
			);
		} catch (error) {
			throw await this.handleCommandError(error, repositoryData, authToken);
		}
	}

	private async handleCommandError(
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
				ownerId: repositoryData?.owner_id!,
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

		this.domainEventEmitter.emit(errorEvent.constructor.name, errorEvent);
		console.error(error);
	}

	@Validate<Repository>(ValidationAction.UPDATE, "RepositoryValidator", {
		requiredFields: ["description", "name", "owner_id", "visibility"],
		supportedFields: ["description", "name", "owner_id", "visibility"],
		entityDataIndex: 1,
		requireAllFields: false,
		requireAtLeastOneField: true,
	})
	async update(
		repository_id: string,
		entityData: Partial<Repository>,
		owner_id: string | undefined,
		auth_token: string,
	): Promise<Repository | Partial<Repository>> {
		const user_id = await this.authenticateAndAuthorize(
			auth_token,
			repository_id,
			"update",
		);
		await this.performRepositoryChecks(
			"update",
			{ ...entityData, id: repository_id },
			{ id: user_id },
		);

		// @TODO verify entity data is !null or !undef
		// Get repo
		const oldRepository = await this.repositoryDetailedRepository.findFirst({
			where: { id: repository_id },
		});

		if (!oldRepository) {
			throw new RepositoryNotFoundError(repository_id);
		}

		// @TODO relocate this?
		const event = new RepositoryUpdatedEvent(
			randomUUID(),
			new Date(),
			{
				...entityData,
				changes: {
					...entityData,
				},
				oldRepository: {
					...oldRepository,
				},
				repositoryId: repository_id,
			},
			user_id,
			Session.getInstance().getUser()?.username,
		);
		this.domainEventEmitter.emit("RepositoryUpdated", event);
		// @TODO re-check this so we can make it super.update()
		return this.repositoryBasicRepository.update(repository_id, entityData);
	}

	async delete(
		repository_id: string,
		owner_id: string | undefined,
		auth_token: string,
	): Promise<void> {
		const user_id = await this.authenticateAndAuthorize(
			auth_token,
			repository_id,
			"delete",
		);

		await this.performRepositoryChecks(
			"delete",
			{ id: repository_id, owner_id: owner_id },
			{ id: user_id },
		);

		// @TODO relocate this?
		const repository = await this.repositoryBasicRepository.findFirst({
			where: { id: repository_id },
		})

		if (!repository || repository.name === undefined) {
            throw new RepositoryNotFoundError(repository_id);
        }

		const event = new RepositoryDeletedEvent(
			randomUUID(),
            new Date(),
            {
				repositoryId: repository_id,
				repositoryName: repository?.name,
            },
            user_id,
		)
		this.domainEventEmitter.emit("RepositoryDeleted", event);
		return this.repositoryBasicRepository.delete(repository_id);
	}

	private async performRepositoryChecks(
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
					{ AND: [{ name: repositoryData.name, owner_id: userData?.id }] },
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
							AND: [{ name: repositoryData.name }, { owner_id: userData?.id }],
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

	private async authenticateAndAuthorize(
		auth_token: string,
		repository_id?: string,
		action: "create" | "update" | "delete" = "create",
	): Promise<string> {
		const user_id =
			await this.repositoryAuthzService.authenticateUser(auth_token);
		if (repository_id) {
			const repository =
				(await this.repositoryFetchService.getRepositoryOrThrow(
					repository_id,
					true,
				)) as RepositoryDetailed;
			switch (action) {
				case "update":
					await this.repositoryAuthzService.throwIfNotRepositoryOwnerOrContributor(
						user_id,
						repository,
					);
					break;
				case "delete":
					await this.repositoryAuthzService.throwIfNotRepositoryOwner(
						user_id,
						repository.owner_id,
					);
					break;
			}
		}
		return user_id;
	}
}
