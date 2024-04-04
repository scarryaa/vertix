import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export default async function errorHandler(
	error: any,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	console.error(error);
	reply.status(500).send({ message: "Internal Server Error" });
}
