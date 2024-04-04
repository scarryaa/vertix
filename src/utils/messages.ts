import type { FastifyReply } from "fastify";

export const replyWithError = (
	reply: FastifyReply,
	message: string,
	statusCode = 400,
) => {
	return reply.code(statusCode).send({ message });
};