import { BaseError } from "./base.error";

export class BadRequestError extends BaseError {
	constructor(
		message = "The request could not be understood. Please check your request and try again.",
	) {
		super(message, "BAD_REQUEST");
	}
}

export class NotFoundError extends BaseError {
	constructor(message = "The requested resource could not be found.") {
		super(message, "NOT_FOUND");
	}
}

export class TimeoutError extends BaseError {
	constructor(message = "The request timed out. Please try again later.") {
		super(message, "TIMEOUT");
	}
}
