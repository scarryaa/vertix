import type { AuthzService } from "../../authorization/authorization.service";
import type { RepositoryDetailed } from "../../models";
import { UnauthorizedError } from "../../utils/errors";

export class RepositoryAuthorizationService {
	constructor(private authzService: AuthzService) {}

	async throwIfNotRepositoryOwnerOrContributor(
		userId: string,
		repository: RepositoryDetailed,
	): Promise<void> {
		const isOwner = repository.ownerId === userId;
		const isContributor = repository.contributors?.some(
			(contributor) => contributor.user_id === userId,
		);

		if (!isOwner && !isContributor) {
			throw new UnauthorizedError();
		}
	}

	async throwIfNotRepositoryOwner(
		userId: string,
		ownerId: string,
	): Promise<void> {
		if (ownerId !== userId) {
			throw new UnauthorizedError();
		}
	}

	async authenticateUser(authToken: string): Promise<string> {
		const userId = await this.authzService.authenticateUser(authToken);
		return userId;
	}
}
