import { BaseError } from ".";

export class DoesNotExistError extends BaseError {
	constructor(message: string) {
		super(message);
		this.name = "DoesNotExistError";
	}
}
