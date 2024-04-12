import type { RepositoryBasicRepository } from "../../repositories/repository-basic.repository";
import {
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
} from "../../utils/errors";
import {
	UserAlreadyExistsError,
	UserNotFoundError,
} from "../../utils/errors/user.error";
import { Validator } from "../../validators/service-layer/base.validator";
import type { UserService } from "../user.service";
import type { Repository } from "./types";

export class RepositoryValidationService extends Validator<Repository> {
	constructor(
		private repositoryBasicRepository: RepositoryBasicRepository,
		private userService: UserService,
		private validationService: Validator<Repository>,
	) {
		super();
	}

	async verifyUserAndRepositoryConditions(
		userId: string | undefined,
		repositoryId: string | undefined,
		shouldRepositoryExist: boolean,
	): Promise<void> {
		const serviceName = this.constructor.name;

		this.validationService.verifyPropertyIsDefined(
			userId,
			"ownerId",
			serviceName,
		);

		// If repositoryId doesn't exist at this point,
		// it means the user is trying to create a new repository
		// so we just return.
		if (!repositoryId) {
			return;
		}

		// Using non-null assertion since we already verified that the props exist
		await this.validateUserAndRepositoryExistence(
			repositoryId!,
			userId!,
			shouldRepositoryExist,
		);
	}

	private async validateUserAndRepositoryExistence(
		repositoryId: string,
		userId: string,
		shouldExist: boolean,
	): Promise<void> {
		const serviceName = this.constructor.name;
		await this.validationService.checkEntityExistence(
			this.repositoryBasicRepository,
			{ AND: [{ id: repositoryId }, { ownerId: userId }] },
			shouldExist,
			new RepositoryNotFoundError(),
			new RepositoryAlreadyExistsError(),
			serviceName,
		);
		await this.validationService.checkEntityExistence(
			this.userService.repositoryBasic,
			{ id: userId },
			// User should always exist in this context
			true,
			new UserNotFoundError(),
			new UserAlreadyExistsError(),
			serviceName,
		);
	}
}
