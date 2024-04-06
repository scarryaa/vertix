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

		descriptor.value = function (...args: string[]) {
			const authToken = args[args.length - 1];

			// Authenticate the token and check if the user has the required roles
			if (!authToken) {
				throw new InvalidTokenError();
			}

			const { userId, role } = authenticator.authenticate(
				authToken,
				requiredRoles,
			);

			return originalMethod.apply(this, [...args.slice(0, -1), userId, role]);
		};

		return descriptor;
	};
}
