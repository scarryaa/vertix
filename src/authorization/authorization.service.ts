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

	async authenticateUser(auth_token: string): Promise<number> {
		const { user_id } = this._authenticator.authenticate(auth_token, [
			UserRole.USER,
		]);
		await this._userService.verifyUserExists({ id: user_id });
		return user_id;
	}
}
