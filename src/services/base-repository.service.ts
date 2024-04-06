import type { Authenticator } from "../authenticators/base.authenticator";
import { UserRole } from "../models";
import type { IRepository } from "../repositories/base.repository";
import { UnauthorizedError, ValidationError } from "../utils/errors";
import type { ValidationResult, Validator } from "../validators/base.validator";

export interface QueryOptions<TModel> {
	limit?: number;
	page?: number;
	skip?: number;
	search?: Partial<TModel>;
}

enum ValidationAction {
	CREATE = 0,
	UPDATE = 1,
}

export interface RepositoryServiceConfig<TModel> {
	repository: IRepository<TModel>;
	authenticator: Authenticator;
	requiredFields: (keyof TModel)[];
	supportedFields: (keyof TModel)[];
	validator: Validator<TModel>;
}

export class RepositoryService<TModel> {
	private readonly repository: IRepository<TModel>;
	private readonly validator: Validator<TModel>;
	private readonly authenticator: Authenticator;
	private readonly requiredFields: (keyof TModel)[];
	private readonly supportedFields: (keyof TModel)[];

	constructor(private readonly config: RepositoryServiceConfig<TModel>) {
		this.repository = config.repository;
		this.authenticator = config.authenticator;
		this.requiredFields = config.requiredFields;
		this.supportedFields = config.supportedFields;
		this.validator = config.validator;
	}

	async getById(id: number): Promise<TModel | null> {
		// @TODO check visibility

		return this.repository.getById(id);
	}

	async getAll(options: QueryOptions<TModel>): Promise<TModel[]> {
		const { limit, page, skip, search } = options;
		const parsedLimit = this.parseLimit(limit);
		const parsedPage = this.parsePage(page);
		const parsedSkip = this.parseSkip(parsedPage, parsedLimit, skip);

		// @TODO check visibility

		return this.repository.getAll({
			limit: parsedLimit,
			skip: parsedSkip,
			page: parsedPage,
			search,
		});
	}

	async create(
		entityData: Partial<TModel>,
		authToken: string,
	): Promise<TModel> {
		// @TODO update auth
		this.authenticate(authToken, [UserRole.USER]);
		this.validate(ValidationAction.CREATE, entityData);

		return this.repository.create(entityData);
	}

	async update(
		id: number,
		entityData: Partial<TModel>,
		authToken: string,
	): Promise<TModel> {
		// @TODO update auth
		this.authenticate(authToken, []);
		this.validate(ValidationAction.UPDATE, entityData);

		return this.repository.update(id, entityData);
	}

	async delete(id: number, authToken: string): Promise<void> {
		// @TODO update auth
		this.authenticate(authToken, []);

		await this.repository.delete(id);
	}

	// Helpers

	private getUpdateRequiredFields(): (keyof TModel)[] {
		return this.requiredFields.filter(
			(field) =>
				field !== "id" && field !== "createdAt" && field !== "updatedAt",
		);
	}

	private authenticate(token: string, roles: string[]): void {
		const isAuthenticated = this.authenticator.authenticate(token, roles);
		if (!isAuthenticated) {
			throw new UnauthorizedError(
				"You are not authorized to perform this action.",
			);
		}
	}

	private validate(
		validationAction: ValidationAction,
		entityData: Partial<TModel>,
	): void {
		let validationResult: ValidationResult<TModel> = { isValid: false };

		switch (validationAction) {
			case ValidationAction.CREATE: {
				this.validator.updateRequiredFields(this.requiredFields);
				validationResult = this.validator.validate(entityData);
				break;
			}
			case ValidationAction.UPDATE: {
				const updateRequiredFields = this.getUpdateRequiredFields();
				this.validator.updateRequiredFields(updateRequiredFields);
				const validationResult = this.validator.validate(entityData);
				break;
			}
		}

		if (!validationResult.isValid) {
			const errorMessages: string[] = [];
			const { missingRequiredFields, unsupportedFields } = validationResult;

			if (missingRequiredFields && missingRequiredFields.length > 0) {
				const missingFieldsMsg = missingRequiredFields.join(", ");
				errorMessages.push(`Missing required fields: ${missingFieldsMsg}.`);
			}

			if (unsupportedFields && unsupportedFields.length > 0) {
				const unsupportedFieldsMsg = unsupportedFields.join(", ");
				errorMessages.push(`Unsupported fields: ${unsupportedFieldsMsg}.`);
			}

			throw new ValidationError(
				`Invalid data for ${validationAction
					.toString()
					.toLowerCase()}. ${errorMessages.join(". ")}`,
			);
		}
	}

	private parseLimit(limit?: number): number {
		return Math.min(100, Math.max(1, limit || 20));
	}

	private parsePage(page?: number): number {
		return Math.max(1, page || 1);
	}

	private parseSkip(page: number, limit: number, skip?: number): number {
		return skip !== undefined ? skip : (page - 1) * limit;
	}
}
