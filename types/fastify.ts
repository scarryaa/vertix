import type { JWT } from "@fastify/jwt";
import { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
	interface FastifyRequest {
		jwt: JWT;
	}
}
