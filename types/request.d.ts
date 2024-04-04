import type { JWT } from "@fastify/jwt";
import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyRequest } from "fastify";

export interface CustomRequest {
	jwt: JWT;
}

declare module "fastify" {
	interface FastifyRequest extends CustomRequest {}
}

export interface CustomInstance extends FastifyInstance {
	jwt: JWT;
	authenticate?: any;
}

export interface CustomInstanceWithAuthenticate extends FastifyInstance {
	authenticate: any;
}

export interface UserRoutesOptions extends FastifyPluginAsync {
}