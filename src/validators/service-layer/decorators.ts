import type { ValidationAction } from "../../services/base-repository.service";
import { MissingPropertyError } from "../../utils/errors";
import { ServiceLocator } from "../../utils/service-locator";
import type { Validator } from "./base.validator";

export interface ValidateOptions<TEntity> {
	requiredFields?: (keyof TEntity)[];
	supportedFields?: (keyof TEntity)[];
	entityDataIndex?: number;
	requireAllFields?: boolean;
	requireAtLeastOneField?: boolean;
}

export interface Validatable<TEntity> {
	validator: Validator<TEntity>;
}

export function Validate<TEntity>(
	validationAction: ValidationAction,
	validatorKey: string, // The key to identify the validator
	options: ValidateOptions<TEntity>,
) {
	return (
		target: any,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>,
	) => {
		const serviceName = target.constructor.name;
		const originalMethod = descriptor.value;
		descriptor.value = async function (...args: any[]) {
			// Fetch the validator using the service locator
			const validator: Validator<TEntity> =
				ServiceLocator.getValidator<TEntity>(validatorKey);

			let entityData: Partial<TEntity> | undefined;
			if (
				options.entityDataIndex !== undefined &&
				options.entityDataIndex < args.length
			) {
				entityData = args[options.entityDataIndex] as Partial<TEntity>;
			}

			// Validate entity data
			if (entityData) {
				// Set the required and supported fields based on the operation
				if (options.requiredFields) {
					validator.setRequiredFields(options.requiredFields);
				}
				if (options.supportedFields) {
					validator.setSupportedFields(options.supportedFields);
				}

				if (options.requireAllFields) {
					// Validate the presence of all required fields
					const allFieldsResult = validator.validateAllFields(
						entityData,
						options.requiredFields || [],
					);

					if (!allFieldsResult.isValid) {
						throw new MissingPropertyError(
							// @TODO revisit this
							allFieldsResult.missingRequiredFields?.[0]?.toString() ??
								"unknown",
							serviceName,
						);
					}
				} else if (options.requireAtLeastOneField) {
					// Validate the presence of at least one required field
					const atLeastOneFieldResult = validator.validateAtLeastOneField(
						entityData,
						options.requiredFields || [],
					);
					if (!atLeastOneFieldResult.isValid) {
						throw new MissingPropertyError(
							// @TODO revisit this
							atLeastOneFieldResult.missingRequiredFields?.[0]?.toString() ??
								"unknown",
							serviceName,
						);
					}
				} else {
					// Validate for unsupported fields and any remaining validation rules
					const {
						isValid,
						missingRequiredFields,
						unsupportedFields,
						errorMessage,
					} = await validator.validate(entityData);
					if (!isValid) {
						throw new MissingPropertyError(
							// @TODO revisit this
							missingRequiredFields?.[0]?.toString() ?? "unknown",
							serviceName,
						);
					}
				}
			}

			if (!originalMethod) {
				throw new Error("Original method is missing!");
			}

			return originalMethod.apply(this, args);
		};
	};
}
