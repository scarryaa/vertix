import type { Authenticator } from "../authenticators/service-layer/base.authenticator";
import { UserRole } from "../models";
import type { UserService } from "../services/user.service";

export class AuthzService {
	private _authenticator: Authenticator;
	private _userService: UserService;

	constructor(authenticator: Authenticator, userService: UserService) {
		this._authenticator = authenticator;
		this._userService = userService;
	}

	async authenticateUser(authToken: string): Promise<string> {
		const { userId } = this._authenticator.authenticate(authToken, [
			UserRole.USER,
		]);
		await this._userService.verifyUserExists({ id: userId });
		return userId;
	}
}
