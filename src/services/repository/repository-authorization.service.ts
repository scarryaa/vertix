import type { AuthzService } from "../../authorization/authorization.service";
import type { RepositoryDetailed } from "../../models";
import { RepositoryNotFoundError, UnauthorizedError } from "../../utils/errors";

export class RepositoryAuthorizationService {
	constructor(private authzService: AuthzService) {}

	async throwIfNotRepositoryOwnerOrContributor(
		user_id: number,
		repository: RepositoryDetailed,
	): Promise<void> {
		const isOwner = repository.owner_id === user_id;
		const isContributor = repository.contributors?.some(
			(contributor) => contributor.user_id === user_id,
		);

		if (!isOwner && !isContributor) {
			throw new UnauthorizedError();
		}
	}

	async throwIfNotRepositoryOwner(
		user_id: number,
		owner_id: number,
	): Promise<void> {
		if (owner_id !== user_id) {
			throw new UnauthorizedError();
		}
	}

	async authenticateUser(auth_token: string): Promise<number> {
		const user_id = await this.authzService.authenticateUser(auth_token);
        return user_id;
	}
}
