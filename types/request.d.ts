import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyPluginOptions,
	FastifyRequest,
} from "fastify";

export interface CustomRequest {
	user?: {
		id: number;
		role: string;
	};
}

declare module "fastify" {
	interface FastifyRequest extends CustomRequest {}
}

export interface AuthenticateInstance extends FastifyInstance {
	// @TODO fix this typing
	authenticate?: any;
}

export interface UserRoutesOptions
	extends FastifyPluginAsync<FastifyPluginOptions> {
	(instance: AuthenticateInstance): Promise<void>;
}
