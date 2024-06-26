import type { UserRole } from "../../models";
import { ServiceLocator } from "../../utils/service-locator";
import type { Authenticator } from "./base.authenticator";

export function Authenticate(
	authenticatorKey: string,
	...requiredRoles: UserRole[]
) {
	return (
		target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const originalMethod = descriptor.value;
		// Fetch the authenticator from the service locator
		const authenticator: Authenticator =
			ServiceLocator.getAuthenticator(authenticatorKey);

		descriptor.value = async function (...args: unknown[]) {
			// Authenticate the token and check roles
			const authToken = args[args.length - 1] as string;
			const { userId, role } = authenticator.authenticate(
				authToken,
				requiredRoles,
			);

			return originalMethod.call(this, ...args);
		};

		return descriptor;
	};
}
