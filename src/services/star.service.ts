import type { Authenticator } from "../authenticators/service-layer/base.authenticator";
import { type Star, UserRole } from "../models";
import type { StarRepository } from "../repositories/star.repository";
import { UnauthorizedError } from "../utils/errors";
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
import type { RepositoryQueryService } from "./repository/repository-query.service";
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
		requiredFields: ["repositoryId"],
		supportedFields: ["repositoryId"],
		entityDataIndex: 0,
		requireAllFields: false,
	})
	async createStar(
		starData: Omit<Star, "id" | "updatedAt" | "createdAt">,
		authToken: string,
	): Promise<Star> {
		const userId = await this.authenticateUser(authToken);
		await this.performStarCreationChecks(starData, userId);
		return this.starRepository.create({ ...starData, userId });
	}

	getStarById(id: string): Promise<Star | null> {
		return this.getStarOrThrow(id);
	}

	async deleteStar(id: string, authToken: string): Promise<void> {
		await this.performStarDeletionChecks(id, authToken);
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
	private async authenticateUser(authToken: string): Promise<string> {
		const { userId } = await this.authenticator.authenticate(authToken, [
			UserRole.USER,
		]);
		return userId;
	}

	private async performStarCreationChecks(
		starData: Omit<Star, "id" | "userId" | "createdAt" | "updatedAt">,
		userId: string,
	): Promise<void> {
		await verifyEntityExists({
			repository: { findFirst: this.findUserFirst.bind(this) },
			condition: { id: userId },
			notFoundError: UserNotFoundError,
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
			condition: { repository_id: starData.repositoryId, user_id: userId },
			foundError: StarAlreadyExistsError,
		});
	}

	private async performStarDeletionChecks(
		starId: string,
		authToken: string,
	): Promise<void> {
		const star = await this.getStarOrThrow(starId);
		const userId = await this.authenticateUser(authToken);

		// @TODO Uncomment this
		// await verifyEntityExists({
		// 	repository: { findFirst: this.findRepositoryFirst.bind(this) },
		// 	condition: { id: star.repository_id },
		// 	NotFoundError: RepositoryNotFoundError,
		// });
		await verifyEntityExists({
			repository: { findFirst: this.findUserFirst.bind(this) },
			condition: { id: star.userId },
			notFoundError: UserNotFoundError,
		});
		if (star.userId !== userId) {
			throw new UnauthorizedError();
		}
	}

	private async getStarOrThrow(starId: string): Promise<Star> {
		const existingStar = await this.starRepository.findFirst({
			where: { id: starId },
		});
		if (!existingStar) {
			throw new StarNotFoundError();
		}
		return existingStar;
	}
}
