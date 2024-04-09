import type { Authenticator } from "../authenticators/service-layer/base.authenticator";
import { type RepositoryDetailed, UserRole } from "../models";
import type { UserService } from "../services/user.service";
import { UnauthorizedError } from "../utils/errors";

export class AuthzService {
	private _authenticator: Authenticator;
	private _userService: UserService;

	constructor(authenticator: Authenticator, userService: UserService) {
		this._authenticator = authenticator;
		this._userService = userService;
	}

	async authenticateUser(auth_token: string): Promise<number> {
		const { user_id } = this._authenticator.authenticate(auth_token, [
			UserRole.USER,
		]);
		await this._userService.verifyUserExists({ id: user_id });
		return user_id;
	}

	async throwIfNotRepositoryOwner(
		owner_id: number,
		repository: { owner_id: number },
	): Promise<void> {
		if (repository.owner_id !== owner_id) {
			throw new UnauthorizedError();
		}
	}

	async throwIfNotRepositoryOwnerOrContributor(
		owner_id: number,
		repository: RepositoryDetailed,
	): Promise<void> {
		const isOwner = repository.owner_id === owner_id;
		const isContributor = repository.contributors?.some(
			(contributor) => contributor.user_id === owner_id,
		);

		if (!isOwner && !isContributor) {
			throw new UnauthorizedError();
		}
	}
}
