import { BaseError } from "./base.error";

export class NotFoundError extends BaseError {
	constructor(message: string, data?: unknown) {
		super(message, "NOT_FOUND_ERROR", data);
	}
}
