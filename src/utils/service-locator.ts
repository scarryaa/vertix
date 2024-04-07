import type { Validator } from "../validators/service-layer/base.validator";

// biome-ignore lint/complexity/noStaticOnlyClass: Needed for service locator
export class ServiceLocator {
	private static validators = new Map<string, Validator<never>>();

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
}
