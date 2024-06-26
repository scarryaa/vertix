import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { NotFoundError } from "../utils/errors";
import { BaseError } from "../utils/errors/base.error";

export const errorHandler = (
	error: Error,
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	if (error instanceof NotFoundError) {
		// If it's a NotFoundError
		reply.code(404).send({
			error: {
				code: error.code,
				message: error.message,
				data: error.data,
			},
		});
	} else if (error instanceof BaseError) {
		// If it's a custom error class
		reply.code(error.code === "UNAUTHORIZED_ERROR" ? 401 : 400).send({
			error: {
				code: error.code,
				message: error.message,
				data: error.data,
			},
		});
	} else if (error && (error as FastifyError).code === "FST_ERR_VALIDATION") {
		// If it's a Fastify validation error
		reply.code((error as FastifyError).statusCode ?? 500).send({
			error: { code: (error as FastifyError).code, message: error.message },
		});
	} else if (error.name && error.name === "FastifyError") {
		// If it's a Fastify error
		reply.code((error as FastifyError).statusCode ?? 500).send({
			error: { code: (error as FastifyError).code, message: error.message },
		});
	} else if (error instanceof ZodError) {
		// If it's a Zod error
		console.error(error);
		reply.code(400).send(error.issues[0]);
	} else {
		// If it's a standard Error or other error
		console.error(error);
		reply.code(500).send({
			error: { code: "INTERNAL_SERVER_ERROR" },
		});
	}
};
