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
		pullRequestData: Partial<PullRequest>,
		authToken: string,
	): Promise<PullRequest> {
		const userId = await this.authenticateUser(authToken);
		await this.authorizeForCreate(userId);
		await this.performPullRequestCreationChecks(pullRequestData, userId);
		return this.pullRequestRepository.create({
			...pullRequestData,
			authorId: userId,
		});
	}

	public async update(
		pullRequestId: string,
		pullRequest: Partial<PullRequest>,
		ownerId: string | undefined,
		authToken: string,
	): Promise<Partial<PullRequest>> {
		const userId = await this.authenticateUser(authToken);
		await this.authorizeForUpdate(userId, pullRequestId);
		await this.performPullRequestUpdateChecks(
			pullRequest,
			userId,
			pullRequestId,
		);
		return this.pullRequestRepository.update(pullRequestId, pullRequest);
	}

	public async delete(
		pullRequestId: string,
		ownerId: string | undefined,
		authToken: string,
	): Promise<void> {
		const userId = await this.authenticateUser(authToken);
		await this.authorizeForDelete(userId, pullRequestId);
		await this.performPullRequestDeletionChecks(pullRequestId, userId);
		return this.pullRequestRepository.delete(pullRequestId);
	}

	public async getById(
		pullRequestId: string,
		detailed = false,
	): Promise<PullRequest | null> {
		return await this.pullRequestFetchService.getPullRequestOrThrow(
			pullRequestId,
		);
	}

	public async getAll(
		options: QueryOptions<PullRequest>,
		authToken: undefined | string,
		detailed?: boolean,
		pullRequestId?: string,
	): Promise<PullRequest[]> {
		if (pullRequestId !== undefined) {
			return await this.pullRequestFetchService.listPullRequestsForRepository(
				pullRequestId,
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
		userId: string,
		pullRequestId?: string,
	): Promise<void> {
		if (pullRequestId) {
			const pullRequest =
				await this.pullRequestFetchService.getPullRequestOrThrow(pullRequestId);
		}
	}

	private async authorizeForDelete(
		userId: string,
		pullRequestId: string,
	): Promise<void> {
		await this.pullRequestAuthzService.throwIfNotPullRequestAuthor(
			userId,
			pullRequestId,
		);
	}

	private async authorizeForUpdate(
		userId: string,
		pullRequestId: string,
	): Promise<void> {
		const pullRequest =
			await this.pullRequestFetchService.getPullRequestOrThrow(pullRequestId);
		await this.pullRequestAuthzService.throwIfNotPullRequestAuthor(
			userId,
			pullRequestId,
		);
	}

	private async authenticateUser(authToken: string): Promise<string> {
		return await this.pullRequestAuthzService.authenticateUser(authToken);
	}

	private async performPullRequestCreationChecks(
		pullRequestData: Partial<PullRequest>,
		userId: string,
	): Promise<void> {
		await this.pullRequestValidationService.validateBranchNames(
			pullRequestData.head_branch,
			pullRequestData.base_branch,
		);
	}

	private async performPullRequestUpdateChecks(
		pullRequest: Partial<PullRequest>,
		userId: string,
		pullRequestId: string,
	): Promise<void> {
		const pull_request =
			await this.pullRequestFetchService.getPullRequestOrThrow(pullRequestId);
		await this.pullRequestAuthzService.throwIfNotPullRequestAuthor(
			userId,
			pullRequestId,
		);
		await this.pullRequestValidationService.validateBranchNames(
			pull_request.head_branch,
			pull_request.base_branch,
		);
		await this.pullRequestValidationService.validateCommitHistory(
			pullRequestId,
		);
	}

	private async performPullRequestDeletionChecks(
		pullRequestId: string,
		userId: string,
	): Promise<void> {
		await this.pullRequestAuthzService.throwIfNotPullRequestAuthor(
			userId,
			pullRequestId,
		);
	}
}
