import type { FastifyReply, FastifyRequest } from "fastify";
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
	type RepositoryInput,
	type RepositoryResponse,
	type UpdateRepositoryInput,
	type UpdateRepositoryParams,
	type UpdateRepositoryResponse,
} from "../schemas/repository.schema";

const container = Container.getInstance();
const repositoryQueryService = Container.repositoryQueryService;
const repositoryCommandService = Container.repositoryCommandService;

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
			errorHandler: (error, request, reply) => {
				reply.send(error);
			},
		},
		createRepository(repositoryCommandService),
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
		getAllRepositories(repositoryQueryService),
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
		getRepository(repositoryQueryService),
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
		updateRepository(repositoryCommandService),
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
		deleteRepository(repositoryCommandService),
	);
};
