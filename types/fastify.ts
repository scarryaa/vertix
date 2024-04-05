import type { JWT } from "@fastify/jwt";

declare module "fastify" {
	interface FastifyRequest {
		jwt: JWT;
	}
}
