import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticateInstance } from "../../types/request";
import { Container } from "../container";
import {
	createRepository,
	deleteRepository,
	getAllRepositories,
	getRepository,
	updateRepository,
} from "../controllers/repository.controller";
import { validateToken } from "../middlewares/validate-token.middleware";
import {
	$ref,
	type DeleteRepositoryParams,
	type DeleteRepositoryQuery,
	type RepositoryInput,
	type RepositoryResponse,
	type UpdateRepositoryInput,
	type UpdateRepositoryParams,
	type UpdateRepositoryResponse,
} from "../schemas/repository.schema";

const container = Container.getInstance();
const repositoryService = container.getRepositoryService();

export const repositoryRoutes = async function repositoryRoutes(
	app: AuthenticateInstance,
) {
	app.get("/", (req: FastifyRequest, reply: FastifyReply) => {
		reply.send({
			message: "This is the default route for the 'repositories' endpoint.",
		});
	});

	app.post<{
		Body: RepositoryInput;
		Response: {
			201: RepositoryResponse;
		};
	}>(
		"/create",
		{
			preHandler: validateToken,
			schema: {
				body: $ref("createRepository"),
				response: {
					201: $ref("createRepositoryResponse"),
				},
			},
		},
		createRepository(repositoryService),
	);

	app.get(
		"/getRepositories",
		{
			schema: {
				response: {
					201: $ref("getRepositoriesResponse"),
				},
			},
		},
		getAllRepositories(repositoryService),
	);

	app.get(
		"/getRepository",
		{
			schema: {
				response: {
					201: $ref("getRepositoryResponse"),
				},
			},
		},
		getRepository(repositoryService),
	);

	app.patch<{
		Params: UpdateRepositoryParams;
		Body: UpdateRepositoryInput;
		Response: {
			200: UpdateRepositoryResponse;
		};
	}>(
		"/update/:id",
		{
			preHandler: validateToken,
			schema: {
				body: $ref("updateRepository"),
				params: $ref("updateRepositoryParamsSchema"),
				response: {
					200: $ref("updateRepositoryResponse"),
				},
			},
		},
		updateRepository(repositoryService),
	);

	app.post<{
		Params: DeleteRepositoryParams;
		Response: {
			204: undefined;
		};
	}>(
		"/delete/:id",
		{
			preHandler: validateToken,
			schema: {
				params: $ref("deleteRepositoryParams"),
				response: {
					204: {
						type: "null",
					},
				},
			},
		},
		deleteRepository(repositoryService),
	);
};
