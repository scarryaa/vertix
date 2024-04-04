import type { FastifyReply } from "fastify";
export enum Types {
	Number = "number",
	String = "string",
}

export const replyWithError = (
	reply: FastifyReply,
	message: string,
	statusCode = 400,
) => {
	return reply.code(statusCode).send({ message });
};
