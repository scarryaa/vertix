import { StatusCodes } from "http-status-codes";

export class BaseError extends Error {
	public statusCode: number;
	public code: string;

	constructor(message: string) {
		super(message);
		this.name = "BaseError";
		this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
		this.code = "INTERNAL_SERVER_ERROR";
	}
}
