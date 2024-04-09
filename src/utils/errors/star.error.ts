import { BaseError } from "./base.error";

export class StarAlreadyExistsError extends BaseError {
	constructor(message = "This star already exists.") {
		super(message, "STAR_ALREADY_EXISTS");
	}
}

export class StarNotFoundError extends BaseError {
	constructor(message = "The star you requested does not exist.") {
		super(message, "STAR_NOT_FOUND");
	}
}
