import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyPluginOptions,
	FastifyRequest,
} from "fastify";
import type {
	RepositoryInput,
	UpdateRepositoryInput,
} from "../src/schemas/repository.schema";

export interface CustomRequest {
	user?: {
		user_id: number;
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
