import assert from "node:assert";
import type { ValidationAction } from "../../services/base-repository.service";
import { ValidationError } from "../../utils/errors";
import type { Validator } from "./base.validator";

export interface ValidateOptions<TEntity> {
	requiredFields?: (keyof TEntity)[];
	supportedFields?: (keyof TEntity)[];
	entityDataIndex?: number;
	requireAllFields?: boolean;
	requireAtLeastOneField?: boolean;
}

export function Validate<
	TEntity,
	TValidator extends Validator<TEntity>,
	TReturn,
	TArgs extends unknown[],
>(
	validator: TValidator,
	validationAction: ValidationAction,
	options: ValidateOptions<TEntity>,
) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<(...args: TArgs) => TReturn>,
	) => {
		const originalMethod = descriptor.value;
		descriptor.value = function (...args: TArgs): TReturn {
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
						throw new ValidationError(
							allFieldsResult.errorMessage ?? "MISSING_REQUIRED_FIELDS",
						);
					}
				} else if (options.requireAtLeastOneField) {
					// Validate the presence of at least one required field
					const atLeastOneFieldResult = validator.validateAtLeastOneField(
						entityData,
						options.requiredFields || [],
					);
					if (!atLeastOneFieldResult.isValid) {
						throw new ValidationError(
							atLeastOneFieldResult.errorMessage ?? "MISSING_REQUIRED_FIELDS",
						);
					}
				} else {
					// Validate for unsupported fields and any remaining validation rules
					const {
						isValid,
						missingRequiredFields,
						unsupportedFields,
						errorMessage,
					} = validator.validate(entityData);
					if (!isValid) {
						throw new ValidationError(errorMessage ?? "VALIDATION_ERROR");
					}
				}
			}

			if (!originalMethod) {
				throw new Error("Original method is missing!");
			}

			return originalMethod.apply(this, args);
		};

		return descriptor as TypedPropertyDescriptor<(...args: TArgs) => TReturn>;
	};
}
