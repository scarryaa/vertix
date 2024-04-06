import { BaseError } from "./base.error";

export class UnauthorizedError extends BaseError {
	constructor(message: string, data?: any) {
		super(message, "UNAUTHORIZED_ERROR", data);
	}
}
