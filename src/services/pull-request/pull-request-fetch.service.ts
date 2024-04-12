import type {
	PullRequest,
	PullRequestStatus,
	ReviewDetailed,
} from "../../models";
import type { QueryOptions } from "../../repositories/base.repository";
import type { PullRequestRepository } from "../../repositories/pull-request.repository";
import { PullRequestNotFoundError } from "../../utils/errors/pull-request.error";

type ListPullRequestsOptions = QueryOptions<PullRequest>;

export class PullRequestFetchService {
	constructor(private readonly pullRequestRepository: PullRequestRepository) {}

	async getPullRequestOrThrow(pullRequestId: string): Promise<PullRequest> {
		const pullRequest = await this.pullRequestRepository.findFirst({
			where: { id: pullRequestId },
		});

		if (!pullRequest) {
			throw new PullRequestNotFoundError();
		}

		return pullRequest;
	}

	async listPullRequestsForRepository(
		repositoryId: string,
		options?: ListPullRequestsOptions,
	): Promise<PullRequest[]> {
		return await this.pullRequestRepository.getAll({
			where: { repository_id: repositoryId },
			...options,
		});
	}

	async listPullRequestsByAuthor(authorId: string): Promise<PullRequest[]> {
		return await this.pullRequestRepository.getAll({
			where: { authorId: authorId },
		});
	}

	async getPullRequestStatus(
		pullRequestId: string,
	): Promise<PullRequestStatus> {
		const pullRequest = await this.getPullRequestOrThrow(pullRequestId);
		return pullRequest.status;
	}

	async fetchPullRequestReviews(
		pullRequestId: string,
	): Promise<ReviewDetailed[]> {
		const pullRequest = await this.getPullRequestOrThrow(pullRequestId);
		return pullRequest.reviews;
	}

	async fetchPullRequestComments(pullRequestId: string): Promise<Comment[]> {
		const pullRequest = await this.getPullRequestOrThrow(pullRequestId);
		return pullRequest.comments;
	}
}
