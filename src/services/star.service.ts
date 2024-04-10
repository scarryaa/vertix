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
import type { RepositoryRepositoryService } from "./repository/repository.service";
import type { UserService } from "./user.service";

interface FindCondition {
	id: number;
}

export interface StarServiceConfig {
	starRepository: StarRepository;
	userService: UserService;
	repositoryService: RepositoryRepositoryService;
	authenticator: Authenticator;
	validator: Validator<Star>;
}

export class StarService {
	private readonly starRepository: StarRepository;
	private readonly userService: UserService;
	private readonly repositoryService: RepositoryRepositoryService;
	private readonly authenticator: Authenticator;
	private readonly validator: Validator<Star>;

	constructor(private readonly config: StarServiceConfig) {
		this.starRepository = config.starRepository;
		this.userService = config.userService;
		this.repositoryService = config.repositoryService;
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

	async getStarById(id: number): Promise<Star | null> {
		return this.getStarOrThrow(id);
	}

	async deleteStar(id: number, auth_token: string): Promise<void> {
		await this.performStarDeletionChecks(id, auth_token);
		await this.starRepository.delete(id);
	}

	// Adapter method for userService
	private async findUserFirst(condition: FindCondition): Promise<boolean> {
		const exists = await this.userService.checkUserExists(condition.id);
		return exists;
	}

	// Adapter method for repositoryService
	private async findRepositoryFirst(
		condition: FindCondition,
	): Promise<boolean> {
		const exists = await this.repositoryService.getById(condition.id);
		return !!exists;
	}

	// Helpers
	private async authenticateUser(auth_token: string): Promise<number> {
		const { user_id } = await this.authenticator.authenticate(auth_token, [
			UserRole.USER,
		]);
		return user_id;
	}

	private async performStarCreationChecks(
		starData: Omit<Star, "id" | "user_id" | "created_at" | "updated_at">,
		user_id: number,
	): Promise<void> {
		await verifyEntityExists({
			repository: { findFirst: this.findUserFirst.bind(this) },
			condition: { id: user_id },
			NotFoundError: UserNotFoundError,
		});
		await verifyEntityExists({
			repository: { findFirst: this.findRepositoryFirst.bind(this) },
			condition: { id: starData.repository_id },
			NotFoundError: RepositoryNotFoundError,
		});
		await verifyEntityDoesNotExist({
			repository: {
				findFirst: this.starRepository.findFirst.bind(this.starRepository),
			},
			condition: { repository_id: starData.repository_id, user_id: user_id },
			FoundError: StarAlreadyExistsError,
		});
	}

	private async performStarDeletionChecks(
		star_id: number,
		auth_token: string,
	): Promise<void> {
		const star = await this.getStarOrThrow(star_id);
		const user_id = await this.authenticateUser(auth_token);

		await verifyEntityExists({
			repository: { findFirst: this.findRepositoryFirst.bind(this) },
			condition: { id: star.repository_id },
			NotFoundError: RepositoryNotFoundError,
		});
		await verifyEntityExists({
			repository: { findFirst: this.findUserFirst.bind(this) },
			condition: { id: star.user_id },
			NotFoundError: UserNotFoundError,
		});
		if (star.user_id !== user_id) {
			throw new UnauthorizedError();
		}
	}

	private async getStarOrThrow(star_id: number): Promise<Star> {
		const existingStar = await this.starRepository.findFirst({
			where: { id: star_id },
		});
		if (!existingStar) {
			throw new StarNotFoundError();
		}
		return existingStar;
	}
}
