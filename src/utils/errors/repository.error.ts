import { BaseError } from "./base.error";

export class InvalidRepositoryNameError extends BaseError {
	constructor(
		message = "The repository name is invalid. It must be between 3 and 64 characters long and contain only alphanumeric characters, hyphens, and underscores.",
	) {
		super(message, "INVALID_REPOSITORY_NAME");
	}
}

export class RepositoryAlreadyExistsError extends BaseError {
	constructor(message = "A repository with this name already exists.") {
		super(message, "REPOSITORY_ALREADY_EXISTS");
	}
}

export class OwnerNotFoundError extends BaseError {
	constructor(message = "The specified owner does not exist.") {
		super(message, "OWNER_NOT_FOUND");
	}
}

export class RepositoryNotFoundError extends BaseError {
	constructor(message = "The repository you requested could not be found.") {
		super(message, "REPOSITORY_NOT_FOUND");
	}
}

export class RepositoryDeleteError extends BaseError {
	constructor(
		message = "The repository could not be deleted. Please try again later.",
	) {
		super(message, "REPOSITORY_DELETE_FAILED");
	}
}

export class RepositoryUpdateError extends BaseError {
	constructor(
		message = "The repository could not be updated. Please check your request and try again.",
	) {
		super(message, "REPOSITORY_UPDATE_FAILED");
	}
}

export class RepositoryCreateError extends BaseError {
	constructor(
		message = "The repository could not be created. Please check your request and try again.",
	) {
		super(message, "REPOSITORY_CREATE_FAILED");
	}
}
