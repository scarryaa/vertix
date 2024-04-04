export type ValidationError = {
	type: "type" | "range" | "value";
	message: string;
};

/**
 * Validates if a value is one of the allowed values in the provided list.
 * @param value - The value to validate.
 * @param allowedValues - An array of allowed values.
 * @param valueName - The name of the value being validated (used in the error message).
 * @returns An error message if the validation fails, or null if it passes.
 */
export const validateAllowedValues = <T>(
	value: T,
	allowedValues: T[],
	valueName: string,
): ValidationError | null => {
	if (!allowedValues.includes(value)) {
		return {
			type: "value",
			message: `Invalid value for ${valueName}. Allowed values are: ${allowedValues.join(
				", ",
			)}`,
		};
	}
	return null;
};

/**
 * Validates if a value is of the specified type.
 * @param value - The value to validate.
 * @param expectedType - The expected type of the value.
 * @param valueName - The name of the value being validated (used in the error message).
 * @returns An error message if the validation fails, or null if it passes.
 */

export const validateType = (
	value: any,
	expectedType: string,
	valueName: string,
): ValidationError | null => {
	if (typeof value !== expectedType) {
		return {
			type: "type",
			message: `Invalid type for ${valueName}. Expected ${expectedType}.`,
		};
	}
	return null;
};

/**
 * Validates if a number is within a specified range.
 * @param value - The number value to validate.
 * @param min - The minimum allowed value (inclusive).
 * @param max - The maximum allowed value (inclusive).
 * @param valueName - The name of the value being validated (used in the error message).
 * @returns An error message if the validation fails, or null if it passes.
 */
export const validateRange = (
	value: number,
	min: number,
	max: number,
	valueName: string,
): ValidationError | null => {
	if (value < min || value > max) {
		return {
			type: "range",
			message: `Invalid value for ${valueName}. Must be between ${min} and ${max}.`,
		};
	}
	return null;
};
