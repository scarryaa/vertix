export type ValidationResult<T> = {
	isValid: boolean;
	missingRequiredFields?: (keyof T)[];
	unsupportedFields?: (keyof T)[];
};

export class Validator<T> {
	private requiredFields: (keyof T)[] = [];
	private supportedFields: (keyof T)[] = [];

	constructor(
		initialRequiredFields: (keyof T)[],
		supportedFields: (keyof T)[],
	) {
		this.requiredFields = initialRequiredFields;
		this.supportedFields = supportedFields;
	}

	updateRequiredFields(requiredFields: (keyof T)[]) {
		this.requiredFields = requiredFields;
	}

	getSupportedFields(): (keyof T)[] {
		return this.supportedFields;
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

		return {
			isValid:
				missingRequiredFields.length === 0 && unsupportedFields.length === 0,
			missingRequiredFields:
				missingRequiredFields.length > 0 ? missingRequiredFields : undefined,
			unsupportedFields:
				unsupportedFields.length > 0 ? unsupportedFields : undefined,
		};
	}

	// async isUserCollaborator(
	// 	repositoryId: number,
	// 	userId: number,
	// ): Promise<boolean> {
	// 	const repository = await this.repoBasic.findById(repositoryId);

	// 	if (repository?.owner_id === userId) {
	// 		return true;
	// 	}

	// 	const collaborator = await this.collabRepo.findOne(repositoryId, userId);

	// 	return !!collaborator;
	// }

	// async isUserOwner(repositoryId: number, userId: number): Promise<boolean> {
	// 	const repository = await this.repoBasic.findById(repositoryId);

	// 	return repository?.owner_id === userId;
	// }

	// private async canUserUpdateRepository(
	// 	repositoryId: number,
	// 	userId: number,
	// ): Promise<boolean> {
	// 	return this.isUserCollaborator(repositoryId, userId);
	// }

	// private async canUserDeleteRepository(
	// 	repositoryId: number,
	// 	userId: number,
	// ): Promise<boolean> {
	// 	return this.isUserOwner(repositoryId, userId);
	// }
}
