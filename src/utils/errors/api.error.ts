import { BaseError } from "./base.error";

export class InvalidParameterError extends BaseError {
	constructor(
		paramName: string,
		message = "The value for parameter '%s' is invalid.",
	) {
		super(message.replace("%s", paramName), "INVALID_PARAMETER");
	}
}

export class MissingParameterError extends BaseError {
	constructor(
		paramName: string,
		message = "Required parameter '%s' is missing.",
	) {
		super(message.replace("%s", paramName), "MISSING_PARAMETER");
	}
}

export class InvalidRequestFormatError extends BaseError {
	constructor(message = "The request is not in a valid format.") {
		super(message, "INVALID_REQUEST_FORMAT");
	}
}
