export type ValidationResult<T> = {
	isValid: boolean;
	missingRequiredFields?: (keyof T)[];
	unsupportedFields?: (keyof T)[];
	errorMessage: string | undefined;
};

export class Validator<T> {
	private requiredFields: (keyof T)[] = [];
	private supportedFields: (keyof T)[] = [];

	setRequiredFields(requiredFields: (keyof T)[]) {
		this.requiredFields = requiredFields;
	}

	setSupportedFields(supportedFields: (keyof T)[]) {
		this.supportedFields = supportedFields;
	}

	validate(data: Partial<T>): ValidationResult<T> {
		const missingRequiredFields: (keyof T)[] = [];
		const unsupportedFields: (keyof T)[] = [];

		// Check if all required fields are present
		for (const field of this.requiredFields) {
			if (!Object.hasOwn(data, field)) {
				missingRequiredFields.push(field);
			}
		}

		// Check if all keys in the data are supported fields
		for (const key in data) {
			if (!this.supportedFields.includes(key as keyof T)) {
				unsupportedFields.push(key as keyof T);
			}
		}

		let errorMessage: string | undefined;
		if (missingRequiredFields.length > 0) {
			errorMessage = `Missing required fields: ${missingRequiredFields.join(
				", ",
			)}`;
		}
		if (unsupportedFields.length > 0) {
			if (errorMessage) {
				errorMessage += " | ";
			} else {
				errorMessage = "";
			}
			errorMessage += `Unsupported fields: ${unsupportedFields.join(", ")}`;
		}

		return {
			isValid:
				missingRequiredFields.length === 0 && unsupportedFields.length === 0,
			missingRequiredFields:
				missingRequiredFields.length > 0 ? missingRequiredFields : undefined,
			unsupportedFields:
				unsupportedFields.length > 0 ? unsupportedFields : undefined,
			errorMessage,
		};
	}

	validateAllFields(
		data: Partial<T>,
		requiredFields: (keyof T)[],
	): ValidationResult<T> {
		const missingFields: (keyof T)[] = [];

		for (const field of requiredFields) {
			if (!Object.hasOwn(data, field)) {
				missingFields.push(field);
			}
		}

		let errorMessage: string | undefined;
		if (missingFields.length > 0) {
			errorMessage = `All of the following fields are required: ${missingFields.join(
				", ",
			)}`;
		}
		
		return {
			isValid: missingFields.length === 0,
			missingRequiredFields:
				missingFields.length > 0 ? missingFields : undefined,
			errorMessage,
		};
	}

	validateAtLeastOneField(
		data: Partial<T>,
		requiredFields: (keyof T)[],
	): ValidationResult<T> {
		const missingAllFields = requiredFields.every(
			(field) => !Object.hasOwn(data, field),
		);

		let errorMessage: string | undefined;
		if (missingAllFields) {
			errorMessage = `At least one of the following fields is required: ${requiredFields.join(
				", ",
			)}`;
		}

		return {
			isValid: !missingAllFields,
			errorMessage,
		};
	}
}
