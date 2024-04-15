import type express from "express";
import { BaseError } from "../errors";

export const errorHandler = (
	err: BaseError | Error,
	req: express.Request,
	res: express.Response,
	next: express.NextFunction,
) => {
	if (err instanceof BaseError) {
		return res.status(404).send({ message: err.message });
	}

	$logger.error(err.stack);

	// Fallback to a generic 500 Internal Server Error response
	res.status(500).send({ message: "Internal server error." });
};
