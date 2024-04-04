import type { FastifyReply, FastifyRequest } from "fastify";
import type { CustomInstance } from "../../../types/request";
import {
	createRepository,
	deleteRepository,
	getAllRepositories,
	getRepository,
	updateRepository,
} from "./repository.controller";
import { $ref } from "./repository.schema";

export const repositoryRoutes = async function repositoryRoutes(
	app: CustomInstance,
) {
	app.get("/", (req: FastifyRequest, reply: FastifyReply) => {
		reply.send({
			message: "This is the default route for the 'repositories' endpoint.",
		});
	});

	app.post(
		"/create",
		{
			schema: {
				body: $ref("repository"),
				response: {
					201: $ref("repositoryResponse"),
				},
			},
		},
		createRepository,
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
		getAllRepositories,
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
		getRepository,
	);

	app.post(
		"/update",
		{
			schema: {
				body: $ref("updateRepository"),
				response: {
					201: $ref("updateRepositoryResponse"),
				},
			},
		},
		updateRepository,
	);

	app.post(
		"/delete",
		{
			schema: {
				body: $ref("deleteRepository"),
				response: 204,
			},
		},
		deleteRepository,
	);
};
