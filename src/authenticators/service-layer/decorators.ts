import type { UserRole } from "../../models";
import { InvalidTokenError } from "../../utils/errors";
import type { Authenticator } from "./base.authenticator";

export function Authenticate(
	authenticator: Authenticator,
	...requiredRoles: UserRole[]
) {
	return (
		target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: unknown[]) {
			// Authenticate the token and check roles
			const auth_token = args[args.length - 1] as string;
			const { user_id, role } = authenticator.authenticate(
				auth_token,
				requiredRoles,
			);

			return originalMethod.call(this, ...args);
		};

		return descriptor;
	};
}
