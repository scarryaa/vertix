import * as dotenv from "dotenv";
import { Authenticator } from "./authenticators/service-layer/base.authenticator";
import { AuthzService } from "./authorization/authorization.service";
import { DomainEventEmitter } from "./events/event-emitter.events";
import { EventStore } from "./events/event-store.events";
import type {
	RepositoryCreatedEvent,
	RepositoryDeletedEvent,
	RepositoryUpdatedEvent,
} from "./events/repository.events";
import type { RepositoryBasic, Star, UserBasic } from "./models";
import type { RepositoryDashboardReadModel } from "./models/read-models/repository.read-model";
import { RepositoryBasicRepository } from "./repositories/repository-basic.repository";
import { RepositoryDetailedRepository } from "./repositories/repository-detailed.repository";
import { SnapshotRepository } from "./repositories/snapshot.repository";
import { StarRepository } from "./repositories/star.repository";
import { UserBasicRepository } from "./repositories/user-basic.repository";
import { UserDetailedRepository } from "./repositories/user-detailed.repository";
import { FileService } from "./services/file/file.service";
import { ReadModelProjector } from "./services/read-model/read-model.projector";
import { ReadModelStore } from "./services/read-model/read-model.store";
import { RepositoryAuthorizationService } from "./services/repository/repository-authorization.service";
import { RepositoryCommandService } from "./services/repository/repository-command.service";
import { RepositoryFetchService } from "./services/repository/repository-fetch.service";
import { RepositoryQueryService } from "./services/repository/repository-query.service";
import { RepositoryValidationService } from "./services/repository/repository-validation.service";
import { SnapshotManager } from "./services/snapshot-manager/snapshot-manager.service";
import { StarService, type StarServiceConfig } from "./services/star.service";
import { UserService, type UserServiceConfig } from "./services/user.service";
import { Session } from "./session/index.session";
import prisma from "./utils/prisma";
import { ServiceLocator } from "./utils/service-locator";
import { Validator } from "./validators/service-layer/base.validator";

export class Container {
	private static instance: Container;

	private userService: UserService;
	private repositoryCommandService: RepositoryCommandService;
	private repositoryQueryService: RepositoryQueryService;
	private _starService: StarService;
	private domainEventEmitter: DomainEventEmitter;
	private eventStore: EventStore;
	private fileService: FileService;
	private readModelProjector: ReadModelProjector;
	private readModelStore: ReadModelStore<
		Record<number, RepositoryDashboardReadModel>
	>;
	// Ignore this since it's set up in a constructor function later
	private repositoryBasicRepository!: RepositoryBasicRepository;

	private constructor() {
		this.checkEnvironmentVariables();

		// Handle Ctrl+C and others
		this.setupSignalHandlers();

		this.readModelStore = this.setupReadModelStore();
		this.domainEventEmitter = this.setupDomainEventEmitter();
		this.eventStore = this.setupEventStore();
		this.readModelProjector = this.setupReadModelProjector(
			this.eventStore,
			this.domainEventEmitter,
			this.readModelStore,
		);
		this.setupEventListeners();

		// biome-ignore lint/style/noNonNullAssertion: We make sure that the secret is not null above
		const authenticator = new Authenticator(process.env.JWT_SECRET!);

		this.fileService = this.setupFileService();
		const userValidator = new Validator<UserBasic>();
		const userBasicRepository = new UserBasicRepository(prisma);
		const userDetailedRepository = new UserDetailedRepository(prisma);
		this.userService = this.setupUserService(
			userBasicRepository,
			userDetailedRepository,
			authenticator,
			userValidator,
			this.fileService,
		);
		const authzService = new AuthzService(authenticator, this.userService);

		const { repositoryCommandService, repositoryQueryService } =
			this.setupRepositoryServices(
				authenticator,
				authzService,
				userBasicRepository,
				this.fileService,
			);
		this.repositoryCommandService = repositoryCommandService;
		this.repositoryQueryService = repositoryQueryService;

		const starValidator = new Validator<Star>();
		const starRepository = new StarRepository(prisma);
		this._starService = this.setupStarService(
			authenticator,
			starRepository,
			starValidator,
		);

		this.registerValidators(
			userValidator,
			new Validator<RepositoryBasic>(),
			starValidator,
		);
	}

	public static get eventEmitter(): DomainEventEmitter {
		return Container.instance.domainEventEmitter;
	}

	public static get eventStore(): EventStore {
		return Container.instance.eventStore;
	}

	private async checkEnvironmentVariables(): Promise<void> {
		process.env.ENVIRONMENT = process.env.NODE_ENV ?? "development";
		await dotenv.config({
			override: true,
			path: `./.env.${process.env.ENVIRONMENT}`,
		});

		if (!process.env.JWT_SECRET) {
			throw new Error("JWT_SECRET environment variable is not set");
		}
	}

	private setupEventListeners(): void {
		// Repository
		this.readModelProjector.rebuildReadModel();
		this.domainEventEmitter.on(
			"RepositoryCreated",
			async (event: RepositoryCreatedEvent) => {
				const { ownerName, repositoryName } = event.payload;
				const fileContent = "" as any;

				// Update the read model database
				await this.repositoryBasicRepository.create({
					name: repositoryName,
					description: event.payload.description,
					visibility: event.payload.visibility,
					ownerId: event.payload.ownerId,
				});

				await this.fileService.uploadFile(`${ownerName}/${repositoryName}/`, fileContent);
			},
		);

		this.domainEventEmitter.on(
			"RepositoryUpdated",
			async (event: RepositoryUpdatedEvent) => {
				try {
					const { changes } = event.payload;
					const currentContent = await this.fileService.downloadFile(
						`${Session.getInstance().getUser()?.username}/${
							event.payload.oldRepository.name
						}/`,
					);

					// If content is null, download failed, so return early
					if (currentContent === null) {
						return;
					}

					// Apply changes to the current content
					const updatedContent = Object.assign({}, currentContent, changes);
					const fileContent = JSON.stringify(updatedContent);

					// Convert the string to a Buffer before uploading
					const fileContentBuffer: Buffer = Buffer.from(fileContent, "utf-8");

					// Use the updated name (if it changed)
					const ownerName = Session.getInstance().getUser()?.username;
					const name = changes.name;

					await this.fileService.renameFile(
						`${ownerName}/${name}/`,
						`${ownerName}/${changes.name}/`,
					);
					await this.fileService.uploadFile(
						`${ownerName}/${changes.name}/testfile.txt`,
						fileContentBuffer,
					);
				} catch (error) {
					console.error(error);
					throw error;
				}
			},
		);

		this.domainEventEmitter.on(
			"RepositoryDeleted",
			async (event: RepositoryDeletedEvent) => {
				await this.eventStore.queueEventForProcessing(event);
				await this.fileService.deleteFile(
					`${Session.getInstance().getUser()?.username}/${
						event.payload.repositoryName
					}/`,
				);
			},
		);
	}

	private setupReadModelStore<
		T extends Record<number, RepositoryDashboardReadModel | undefined>,
	>(): ReadModelStore<T> {
		const initialState: T = {} as T; // @TODO provide initial state
		return new ReadModelStore<T>(this.eventStore, initialState);
	}

	private setupFileService(): FileService {
		return new FileService({
			storagePath: "codestash/repositories",
		});
	}

	private setupUserService(
		userBasicRepository: UserBasicRepository,
		userDetailedRepository: UserDetailedRepository,
		authenticator: Authenticator,
		validator: Validator<UserBasic>,
		fileService: FileService,
	): UserService {
		const userConfig: UserServiceConfig = {
			config: {
				repository: userBasicRepository,
				fileService,
			},
			userBasicRepository,
			userDetailedRepository,
			authenticator,
			validator,
		};
		return new UserService(userConfig);
	}

	private setupDomainEventEmitter(): DomainEventEmitter {
		return new DomainEventEmitter();
	}

	private setupReadModelProjector(
		eventStore: EventStore,
		domainEventEmitter: DomainEventEmitter,
		readModelStore: ReadModelStore<
			Record<number, RepositoryDashboardReadModel>
		>,
	): ReadModelProjector {
		return new ReadModelProjector(
			eventStore,
			domainEventEmitter,
			readModelStore,
		);
	}

	private setupEventStore(): EventStore {
		return new EventStore();
	}

	private setupRepositoryServices(
		authenticator: Authenticator,
		authzService: AuthzService,
		userBasicRepository: UserBasicRepository,
		fileService: FileService,
	): {
		repositoryCommandService: RepositoryCommandService;
		repositoryQueryService: RepositoryQueryService;
	} {
		const repositorySnapshotRepository =
			new SnapshotRepository<RepositoryBasic>(prisma, "repository");
		const repositorySnapshotManager = new SnapshotManager<RepositoryBasic>(
			repositorySnapshotRepository,
		);

		const repositoryValidator = new Validator<RepositoryBasic>();
		const repositoryBasicRepository = new RepositoryBasicRepository(
			prisma,
			repositorySnapshotManager,
		);
		this.repositoryBasicRepository = repositoryBasicRepository;

		const repositoryDetailedRepository = new RepositoryDetailedRepository(
			prisma,
		);
		const repositoryFetchService = new RepositoryFetchService(
			repositoryBasicRepository,
			repositoryDetailedRepository,
		);
		const repositoryValidationService = new RepositoryValidationService(
			repositoryBasicRepository,
			this.userService,
			repositoryValidator,
		);
		const repositoryAuthzService = new RepositoryAuthorizationService(
			authzService,
		);

		const repositoryCommandService = this.setupRepositoryCommandService(
			repositoryBasicRepository,
			repositoryDetailedRepository,
			repositoryAuthzService,
			repositoryFetchService,
			repositoryValidationService,
			this.userService,
			fileService,
			this.eventStore,
		);

		const repositoryQueryService = this.setupRepositoryQueryService(
			repositoryBasicRepository,
			repositoryDetailedRepository,
			repositoryFetchService,
		);

		return {
			repositoryCommandService: repositoryCommandService,
			repositoryQueryService: repositoryQueryService,
		};
	}

	private setupRepositoryCommandService(
		repositoryBasicRepository: RepositoryBasicRepository,
		repositoryDetailedRepository: RepositoryDetailedRepository,
		repositoryAuthzService: RepositoryAuthorizationService,
		repositoryFetchService: RepositoryFetchService,
		repositoryValidationService: RepositoryValidationService,
		userService: UserService,
		fileService: FileService,
		eventStore: EventStore,
	): RepositoryCommandService {
		return new RepositoryCommandService(
			{
				repositoryBasicRepository,
				repositoryDetailedRepository,
			},
			{
				eventEmitter: this.domainEventEmitter,
				repositoryAuthzService,
				repositoryFetchService,
				repositoryValidationService,
				userService,
				fileService,
				eventStore,
			},
		);
	}

	private setupRepositoryQueryService(
		repositoryBasicRepository: RepositoryBasicRepository,
		repositoryDetailedRepository: RepositoryDetailedRepository,
		repositoryFetchService: RepositoryFetchService,
	): RepositoryQueryService {
		return new RepositoryQueryService({
			repositoryBasicRepository,
			repositoryDetailedRepository,
			repositoryFetchService,
		});
	}

	private setupStarService(
		authenticator: Authenticator,
		starRepository: StarRepository,
		validator: Validator<Star>,
	): StarService {
		const starConfig: StarServiceConfig = {
			authenticator,
			starRepository,
			repositoryCommandService: this.repositoryCommandService,
			repositoryQueryService: this.repositoryQueryService,
			validator,
			userService: this.userService,
		};
		return new StarService(starConfig);
	}

	private registerValidators(
		userValidator: Validator<UserBasic>,
		repositoryValidator: Validator<RepositoryBasic>,
		starValidator: Validator<Star>,
	): void {
		ServiceLocator.registerValidator("UserValidator", userValidator);
		ServiceLocator.registerValidator(
			"RepositoryValidator",
			repositoryValidator,
		);
		ServiceLocator.registerValidator("StarValidator", starValidator);
	}

	private setupSignalHandlers(): void {
		process.on("SIGINT", () => {
			console.log("SIGINT signal received: closing the application...");
			this.shutdownApp();
		});

		process.on("SIGTERM", () => {
			console.log("SIGTERM signal received: closing the application...");
			this.shutdownApp();
		});
	}

	private shutdownApp(): void {
		this.readModelProjector.dispose();
		process.exit(0);
	}

	public static getInstance(): Container {
		if (!Container.instance) {
			Container.instance = new Container();
		}
		return Container.instance;
	}

	public static get repositoryCommandService(): RepositoryCommandService {
		return Container.getInstance().repositoryCommandService;
	}

	public static get repositoryQueryService(): RepositoryQueryService {
		return Container.getInstance().repositoryQueryService;
	}

	public getUserService(): UserService {
		return this.userService;
	}

	public getStarService(): StarService {
		return this._starService;
	}
}
