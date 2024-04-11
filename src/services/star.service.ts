import type { Authenticator } from "../authenticators/service-layer/base.authenticator";
import { type Star, UserRole } from "../models";
import type { StarRepository } from "../repositories/star.repository";
import { RepositoryNotFoundError, UnauthorizedError } from "../utils/errors";
import {
	StarAlreadyExistsError,
	StarNotFoundError,
} from "../utils/errors/star.error";
import { UserNotFoundError } from "../utils/errors/user.error";
import type { Validator } from "../validators/service-layer/base.validator";
import { Validate } from "../validators/service-layer/decorators";
import {
	verifyEntityDoesNotExist,
	verifyEntityExists,
} from "../validators/service-layer/util";
import { ValidationAction } from "./base-repository.service";
import type { RepositoryCommandService } from "./repository/repository-command.service";
import type {
	GetRepositoryByIdParams,
	RepositoryQueryService,
} from "./repository/repository-query.service";
import type { UserService } from "./user.service";

interface FindCondition {
	id: string;
}

export interface StarServiceConfig {
	starRepository: StarRepository;
	userService: UserService;
	repositoryCommandService: RepositoryCommandService;
	repositoryQueryService: RepositoryQueryService;
	authenticator: Authenticator;
	validator: Validator<Star>;
}

export class StarService {
	private readonly starRepository: StarRepository;
	private readonly userService: UserService;
	private readonly repositoryCommandService: RepositoryCommandService;
	private readonly repositoryQueryService: RepositoryQueryService;
	private readonly authenticator: Authenticator;
	private readonly validator: Validator<Star>;

	constructor(private readonly config: StarServiceConfig) {
		this.starRepository = config.starRepository;
		this.userService = config.userService;
		this.repositoryCommandService = config.repositoryCommandService;
		this.repositoryQueryService = config.repositoryQueryService;
		this.authenticator = config.authenticator;
		this.validator = config.validator;
	}

	@Validate<Star>(ValidationAction.CREATE, "StarValidator", {
		requiredFields: ["repository_id"],
		supportedFields: ["repository_id"],
		entityDataIndex: 0,
		requireAllFields: false,
	})
	async createStar(
		starData: Omit<Star, "id" | "user_id" | "created_at" | "updated_at">,
		auth_token: string,
	): Promise<Star> {
		const user_id = await this.authenticateUser(auth_token);
		await this.performStarCreationChecks(starData, user_id);
		return this.starRepository.create({ ...starData, user_id });
	}

	async getStarById(id: string): Promise<Star | null> {
		return this.getStarOrThrow(id);
	}

	async deleteStar(id: string, auth_token: string): Promise<void> {
		await this.performStarDeletionChecks(id, auth_token);
		await this.starRepository.delete(id);
	}

	// Adapter method for userService
	private async findUserFirst(condition: FindCondition): Promise<boolean> {
		const exists = await this.userService.checkUserExists(condition.id);
		return exists;
	}

	// @TODO Uncomment this
	// Adapter method for repositoryService
	// private async findRepositoryFirst(
	// 	condition: FindCondition,
	// ): Promise<boolean> {
	// 	try {
	// 		const repository =
	// 			await this.repositoryQueryService.handleQuery<GetRepositoryByIdParams>(
	// 				QueryType.GetRepositoryById,
	// 				{ repositoryId: condition.id, detailed: false },
	// 			);
	// 		return !!repository;
	// 	} catch (error) {
	// 		if (error instanceof RepositoryNotFoundError) {
	// 			return false;
	// 		}
	// 		throw error; // Rethrow if it's not a not found error
	// 	}
	// }
	// Helpers
	private async authenticateUser(auth_token: string): Promise<string> {
		const { user_id } = await this.authenticator.authenticate(auth_token, [
			UserRole.USER,
		]);
		return user_id;
	}

	private async performStarCreationChecks(
		starData: Omit<Star, "id" | "user_id" | "created_at" | "updated_at">,
		user_id: string,
	): Promise<void> {
		await verifyEntityExists({
			repository: { findFirst: this.findUserFirst.bind(this) },
			condition: { id: user_id },
			NotFoundError: UserNotFoundError,
		});
		// @TODO Uncomment this
		// await verifyEntityExists({
		// 	repository: { findFirst: this.findRepositoryFirst.bind(this) },
		// 	condition: { id: starData.repository_id },
		// 	NotFoundError: RepositoryNotFoundError,
		// });
		await verifyEntityDoesNotExist({
			repository: {
				findFirst: this.starRepository.findFirst.bind(this.starRepository),
			},
			condition: { repository_id: starData.repository_id, user_id: user_id },
			FoundError: StarAlreadyExistsError,
		});
	}

	private async performStarDeletionChecks(
		star_id: string,
		auth_token: string,
	): Promise<void> {
		const star = await this.getStarOrThrow(star_id);
		const user_id = await this.authenticateUser(auth_token);

		// @TODO Uncomment this
		// await verifyEntityExists({
		// 	repository: { findFirst: this.findRepositoryFirst.bind(this) },
		// 	condition: { id: star.repository_id },
		// 	NotFoundError: RepositoryNotFoundError,
		// });
		await verifyEntityExists({
			repository: { findFirst: this.findUserFirst.bind(this) },
			condition: { id: star.user_id },
			NotFoundError: UserNotFoundError,
		});
		if (star.user_id !== user_id) {
			throw new UnauthorizedError();
		}
	}

	private async getStarOrThrow(star_id: string): Promise<Star> {
		const existingStar = await this.starRepository.findFirst({
			where: { id: star_id },
		});
		if (!existingStar) {
			throw new StarNotFoundError();
		}
		return existingStar;
	}
}
