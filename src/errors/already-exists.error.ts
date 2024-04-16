import { StatusCodes } from "http-status-codes";
import { BaseError } from ".";

export class AlreadyExistsError extends BaseError {
	constructor(message: string) {
		super(message);
		this.name = "AlreadyExistsError";
		this.statusCode = StatusCodes.CONFLICT;
		this.code = "ALREADY_EXISTS";
	}
}
