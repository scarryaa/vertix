import type express from "express";
import { BaseError } from "../errors";

export const errorHandler = (
	err: BaseError | Error,
	req: express.Request,
	res: express.Response,
	next: express.NextFunction,
) => {
	// Log all errors
	$logger.error(err.stack || err.message);

	if (err instanceof BaseError) {
		// Use the status code from BaseError if available, otherwise default to 500
		const statusCode = err.statusCode || 500;
		return res
			.status(statusCode)
			.send({ message: err.message, errorCode: err.code });
	}

	// Fallback to a generic 500 Internal Server Error response for unexpected errors
	res.status(500).send({ message: "Internal server error." });
};
