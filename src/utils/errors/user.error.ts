import { BaseError } from "./base.error";

export class UserAlreadyExistsError extends BaseError {
	constructor(message = "A user with this email or username already exists.") {
		super(message, "USER_ALREADY_EXISTS");
	}
}

export class UsernameAlreadyExistsError extends BaseError {
	constructor(message = "The provided username is already in use.") {
		super(message, "USERNAME_ALREADY_EXISTS");
	}
}

export class EmailAlreadyExistsError extends BaseError {
	constructor(
		message = "The provided email address is already associated with another account.",
	) {
		super(message, "EMAIL_ALREADY_EXISTS");
	}
}

export class UserDoesNotExistError extends BaseError {
	constructor(message = "The specified user does not exist.") {
		super(message, "USER_NOT_FOUND");
	}
}
