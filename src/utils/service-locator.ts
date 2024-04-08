import type { Authenticator } from "../authenticators/service-layer/base.authenticator";
import type { Validator } from "../validators/service-layer/base.validator";

// biome-ignore lint/complexity/noStaticOnlyClass: Needed for service locator
export class ServiceLocator {
	private static validators = new Map<string, Validator<never>>();
	private static authenticators = new Map<string, Authenticator>();

	public static registerValidator<T>(key: string, validator: Validator<T>) {
		ServiceLocator.validators.set(key, validator);
	}

	public static getValidator<T>(key: string): Validator<T> {
		const validator = ServiceLocator.validators.get(key);
		if (!validator) {
			throw new Error(`Validator for key "${key}" not found.`);
		}
		return validator as Validator<T>;
	}

	public static registerAuthenticator(
		key: string,
		authenticator: Authenticator,
	) {
		ServiceLocator.authenticators.set(key, authenticator);
	}

	public static getAuthenticator(key: string): Authenticator {
		const authenticator = ServiceLocator.authenticators.get(key);
		if (!authenticator) {
			throw new Error(`Authenticator for key "${key}" not found.`);
		}
		return authenticator as Authenticator;
	}
}
