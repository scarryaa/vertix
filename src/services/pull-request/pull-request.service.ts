import type { Authenticator } from "../../authenticators/service-layer/base.authenticator";
import type { PullRequest } from "../../models";
import type { QueryOptions } from "../../repositories/base.repository";
import type { PullRequestRepository } from "../../repositories/pull-request.repository";
import type { Validator } from "../../validators/service-layer/base.validator";
import {
	RepositoryService,
	type RepositoryServiceConfig,
} from "../base-repository.service";
import type { PullRequestAuthorizationService } from "./pull-request-authorization.service";
import type { PullRequestFetchService } from "./pull-request-fetch.service";
import type { PullRequestValidationService } from "./pull-request-validation.service";

export type PullRequestServiceConfig = {
	config: RepositoryServiceConfig<PullRequest>;
};

export type PullRequestServices = {
	repository: PullRequestRepository;
	fetchService: PullRequestFetchService;
	validationService: PullRequestValidationService;
	authorizationService: PullRequestAuthorizationService;
	authenticator: Authenticator;
	validator: Validator<PullRequest>;
};
export class PullRequestService extends RepositoryService<PullRequest> {
	private _authenticator: Authenticator;
	private _validator: Validator<PullRequest>;

	private readonly pullRequestRepository: PullRequestRepository;
	private readonly pullRequestValidationService: PullRequestValidationService;
	private readonly pullRequestAuthzService: PullRequestAuthorizationService;
	private readonly pullRequestFetchService: PullRequestFetchService;

	constructor(
		private readonly _config: PullRequestServiceConfig,
		private readonly _services: PullRequestServices,
	) {
		super(_config.config);
		this.pullRequestRepository = _services.repository;
		this.pullRequestValidationService = _services.validationService;
		this.pullRequestAuthzService = _services.authorizationService;
		this.pullRequestFetchService = _services.fetchService;
		this._authenticator = _services.authenticator;
		this._validator = _services.validator;
	}

	public async create(
		pull_request_data: Partial<PullRequest>,
		auth_token: string,
	): Promise<PullRequest> {
		const user_id = await this.authenticateUser(auth_token);
		await this.authorizeForCreate(user_id);
		await this.performPullRequestCreationChecks(pull_request_data, user_id);
		return this.pullRequestRepository.create({
			...pull_request_data,
			authorId: user_id,
		});
	}

	public async update(
		pull_request_id: string,
		pullRequest: Partial<PullRequest>,
		owner_id: string | undefined,
		auth_token: string,
	): Promise<Partial<PullRequest>> {
		const user_id = await this.authenticateUser(auth_token);
		await this.authorizeForUpdate(user_id, pull_request_id);
		await this.performPullRequestUpdateChecks(
			pullRequest,
			user_id,
			pull_request_id,
		);
		return this.pullRequestRepository.update(pull_request_id, pullRequest);
	}

	public async delete(
		pull_request_id: string,
		owner_id: string | undefined,
		auth_token: string,
	): Promise<void> {
		const user_id = await this.authenticateUser(auth_token);
		await this.authorizeForDelete(user_id, pull_request_id);
		await this.performPullRequestDeletionChecks(pull_request_id, user_id);
		return this.pullRequestRepository.delete(pull_request_id);
	}

	public async getById(
		pull_request_id: string,
		detailed = false,
	): Promise<PullRequest | null> {
		return await this.pullRequestFetchService.getPullRequestOrThrow(
			pull_request_id,
		);
	}

	public async getAll(
		options: QueryOptions<PullRequest>,
		auth_token: undefined | string,
		detailed?: boolean,
		pull_request_id?: string,
	): Promise<PullRequest[]> {
		if (pull_request_id !== undefined) {
			return await this.pullRequestFetchService.listPullRequestsForRepository(
				pull_request_id,
				options,
			);
		}

		return [];
	}

	public async getByAuthor(authorId: string): Promise<PullRequest[]> {
		return await this.pullRequestFetchService.listPullRequestsByAuthor(
			authorId,
		);
	}

	private async authorizeForCreate(
		user_id: string,
		pull_request_id?: string,
	): Promise<void> {
		if (pull_request_id) {
			const pull_request =
				await this.pullRequestFetchService.getPullRequestOrThrow(
					pull_request_id,
				);
		}
	}

	private async authorizeForDelete(
		user_id: string,
		pull_request_id: string,
	): Promise<void> {
		await this.pullRequestAuthzService.throwIfNotPullRequestAuthor(
			user_id,
			pull_request_id,
		);
	}

	private async authorizeForUpdate(
		user_id: string,
		pull_request_id: string,
	): Promise<void> {
		const pull_request =
			await this.pullRequestFetchService.getPullRequestOrThrow(pull_request_id);
		await this.pullRequestAuthzService.throwIfNotPullRequestAuthor(
			user_id,
			pull_request_id,
		);
	}

	private async authenticateUser(auth_token: string): Promise<string> {
		return await this.pullRequestAuthzService.authenticateUser(auth_token);
	}

	private async performPullRequestCreationChecks(
		pull_request_data: Partial<PullRequest>,
		user_id: string,
	): Promise<void> {
		await this.pullRequestValidationService.validateBranchNames(
			pull_request_data.head_branch,
			pull_request_data.base_branch,
		);
	}

	private async performPullRequestUpdateChecks(
		pullRequest: Partial<PullRequest>,
		user_id: string,
		pull_request_id: string,
	): Promise<void> {
		const pull_request =
			await this.pullRequestFetchService.getPullRequestOrThrow(pull_request_id);
		await this.pullRequestAuthzService.throwIfNotPullRequestAuthor(
			user_id,
			pull_request_id,
		);
		await this.pullRequestValidationService.validateBranchNames(
			pull_request.head_branch,
			pull_request.base_branch,
		);
		await this.pullRequestValidationService.validateCommitHistory(
			pull_request_id,
		);
	}

	private async performPullRequestDeletionChecks(
		pull_request_id: string,
		user_id: string,
	): Promise<void> {
		await this.pullRequestAuthzService.throwIfNotPullRequestAuthor(
			user_id,
			pull_request_id,
		);
	}
}
