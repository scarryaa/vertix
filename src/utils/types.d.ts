import type { JWT } from "@fastify/jwt";

// adds jwt property to FastifyRequest,
// authenticate property to FastifyInstance
declare module "fastify" {
	export interface FastifyRequest {
		jwt: JWT;
	}
	export interface FastifyInstance {
		// biome-ignore lint/suspicious/noExplicitAny: suppress any type error
		authenticate: any;
	}
}

type UserPayload = {
	id: string;
	email: string;
	name: string;
};

declare module "@fastify/jwt" {
	// @ts-ignore
	export interface FastifyJWT {
		user: UserPayload;
	}
}
