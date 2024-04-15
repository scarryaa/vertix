import { BaseError } from ".";

export class AlreadyExistsError extends BaseError {
	constructor(message: string) {
		super(message);
		this.name = "AlreadyExistsError";
	}
}
