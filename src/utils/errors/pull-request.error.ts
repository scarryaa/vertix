import { BaseError } from "./base.error";

export class InvalidRPullRequestNameError extends BaseError {
	constructor(message = "The pull_request name is invalid.") {
		super(message, "INVALID_PULL_REQUEST_NAME");
	}
}

export class PullRequestAlreadyExistsError extends BaseError {
	constructor(message = "A pull_request with this name already exists.") {
		super(message, "PULL_REQUEST_ALREADY_EXISTS");
	}
}

export class OwnerNotFoundError extends BaseError {
	constructor(message = "The specified owner does not exist.") {
		super(message, "OWNER_NOT_FOUND");
	}
}

export class PullRequestNotFoundError extends BaseError {
	constructor(message = "The pull request you requested could not be found.") {
		super(message, "PULL_REQUEST_NOT_FOUND");
	}
}

export class PullRequestDeleteError extends BaseError {
	constructor(
		message = "The repository could not be deleted. Please try again later.",
	) {
		super(message, "PULL_REQUEST_DELETE_FAILED");
	}
}

export class PullRequestUpdateError extends BaseError {
	constructor(
		message = "The pull request could not be updated. Please check your request and try again.",
	) {
		super(message, "PULL_REQUEST_UPDATE_FAILED");
	}
}

export class PullRequestMergeError extends BaseError {
	constructor(
		message = "The pull request could not be merged. Please check your request and try again.",
	) {
		super(message, "PULL_REQUEST_MERGE_FAILED");
	}
}
