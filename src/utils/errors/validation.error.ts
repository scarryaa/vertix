import { BaseError } from "./base.error";

export class ValidationError extends BaseError {
	constructor(message = "VALIDATION_ERROR") {
		super(message, "VALIDATION_ERROR");
	}
}