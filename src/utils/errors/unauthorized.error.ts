import { BaseError } from "./base.error";

export class UnauthorizedError extends BaseError {
	constructor(message: string, data?: unknown) {
		super(message, "UNAUTHORIZED_ERROR", data);
	}
}
