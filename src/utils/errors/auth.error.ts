import { BaseError } from "./base.error";

export class UnauthorizedError extends BaseError {
	constructor(message = "You are not authorized to perform this action.") {
		super(message, "UNAUTHORIZED");
	}
}

export class InvalidTokenError extends BaseError {
	constructor(message = "The authentication token is invalid or expired.") {
		super(message, "INVALID_TOKEN");
	}
}

export class MissingTokenError extends BaseError {
	constructor(
		message = "An authentication token is required for this operation.",
	) {
		super(message, "MISSING_TOKEN");
	}
}
