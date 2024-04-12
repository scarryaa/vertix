import type { AuthzService } from "../../authorization/authorization.service";

export class PullRequestAuthorizationService {
	constructor(private authzService: AuthzService) {}

	async throwIfNotPullRequestAuthor(
		userId: string,
		pullRequestId: string,
	): Promise<void> {
		// Throw an error if the user is not the author of the pull request
	}

	async throwIfNoRepositoryAccess(
		userId: string,
		repositoryId: string,
	): Promise<void> {
		// Check if the user has access to the repository
	}

	async throwIfCannotMerge(
		userId: string,
		pullRequestId: string,
	): Promise<void> {
		// Check if the user can merge the pull request
	}

	async throwIfCannotReview(
		userId: string,
		pullRequestId: string,
	): Promise<void> {
		// Check if the user can review the pull request
	}

	async authenticateUser(authToken: string): Promise<string> {
		const userId = await this.authzService.authenticateUser(authToken);
		return userId;
	}
}
