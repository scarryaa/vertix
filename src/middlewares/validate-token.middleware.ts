import type { FastifyReply, FastifyRequest } from "fastify";
import { InvalidTokenError, MissingTokenError } from "../utils/errors";

export const validateToken = (
	req: FastifyRequest,
	reply: FastifyReply,
	next: () => unknown,
) => {
	const authToken = req.cookies.access_token;

	if (!authToken) {
		throw new MissingTokenError();
	}

	const unsignedToken = reply.unsignCookie(authToken).value;
	if (!unsignedToken) {
		throw new InvalidTokenError();
	}

	req.unsignedToken = unsignedToken;
	next();
};
