import { StatusCodes } from "http-status-codes";
import { BaseError } from ".";

export class DoesNotExistError extends BaseError {
	constructor(message: string) {
		super(message);
		this.name = "DoesNotExistError";
		this.statusCode = StatusCodes.NOT_FOUND;
		this.code = "DOES_NOT_EXIST";
	}
}
