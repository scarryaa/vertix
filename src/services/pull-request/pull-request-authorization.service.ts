import type { AuthzService } from "../../authorization/authorization.service";

export class PullRequestAuthorizationService {
	constructor(private authzService: AuthzService) {}

	async throwIfNotPullRequestAuthor(
		user_id: string,
		pullRequestId: string,
	): Promise<void> {
		// Throw an error if the user is not the author of the pull request
	}

	async throwIfNoRepositoryAccess(
		user_id: string,
		repositoryId: string,
	): Promise<void> {
		// Check if the user has access to the repository
	}

	async throwIfCannotMerge(
		user_id: string,
		pullRequestId: string,
	): Promise<void> {
		// Check if the user can merge the pull request
	}

	async throwIfCannotReview(
		user_id: string,
		pullRequestId: string,
	): Promise<void> {
		// Check if the user can review the pull request
	}

	async authenticateUser(auth_token: string): Promise<string> {
		const user_id = await this.authzService.authenticateUser(auth_token);
		return user_id;
	}
}
