import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyPluginOptions,
} from "fastify";
import type { RepositoryInput } from "../src/schemas/repository.schema";

export interface CustomRequest {
	user?: {
		userId: string;
		role: string;
	};
	unsignedToken: string;
	Params: {
		id: string;
	};
	Body: RepositoryInput;
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
