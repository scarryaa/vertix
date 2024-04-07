import type { FastifyReply, FastifyRequest } from "fastify";
import type { RepositoryBasic } from "../models";
import {
	type GetRepositoriesInput,
	type GetRepositoriesResponse,
	type GetRepositoryInput,
	type RepositoryInput,
	type RepositoryResponse,
	type UpdateRepositoryInput,
	createRepositorySchema,
	deleteRepositoryParamsSchema,
	getRepositoriesSchema,
	getRepositorySchema,
	updateRepositorySchema,
} from "../schemas/repository.schema";
import type { RepositoryRepositoryService } from "../services/repository.service";
import { RepositoryNotFoundError } from "../utils/errors";
import { mapRepositoryResponse } from "../utils/repository-validation";

export const createRepository =
	(repositoryService: RepositoryRepositoryService) =>
	async (
		req: FastifyRequest<{ Body?: RepositoryInput }>,
		reply: FastifyReply,
	): Promise<RepositoryResponse> => {
		const { name, description, visibility } = createRepositorySchema.parse(
			req.body,
		);

		// Create repository
		const newRepository = await repositoryService.create(
			{
				name,
				description,
				visibility,
			},
			req.unsignedToken,
		);

		return reply.code(201).send(newRepository);
	};

export const getAllRepositories =
	(repositoryService: RepositoryRepositoryService) =>
	async (
		req: FastifyRequest<{ Querystring: GetRepositoriesInput }>,
		reply: FastifyReply,
	) => {
		try {
			const { limit, page, search, visibility, owner_id, skip } =
				getRepositoriesSchema.parse(req.query);

			// If we passed validation, we can continue
			const fetchedRepositories = await repositoryService.getAll({
				limit: limit,
				page: page,
				search: {},
				skip,
			});

			// Check if repositories is empty
			if (fetchedRepositories.length === 0) {
				throw new RepositoryNotFoundError("No repositories found.");
			}

			const response: GetRepositoriesResponse = {
				repositories: fetchedRepositories.map((repo) =>
					mapRepositoryResponse(
						repo,
						repo.owner_id ?? undefined,
						repo.created_at ?? undefined,
						repo.updated_at ?? undefined,
						repo.visibility ?? undefined,
					),
				),
				total_count: fetchedRepositories.length,
				page: page ?? 1,
				limit: limit ?? 20,
			};

			return reply.code(200).send(response);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

export const getRepository =
	(repositoryService: RepositoryRepositoryService) =>
	async (
		req: FastifyRequest<{ Querystring: { id: GetRepositoryInput } }>,
		reply: FastifyReply,
	) => {
		const { id } = getRepositorySchema.parse(req.query);

		// Otherwise, we can proceed
		const repository = await repositoryService.getById(id);

		if (!repository) {
			throw new RepositoryNotFoundError();
		}

		return reply.code(200).send(repository);
	};

export const updateRepository =
	(repositoryService: RepositoryRepositoryService) =>
	async (
		req: FastifyRequest<{
			Params: { id: number };
			Body: UpdateRepositoryInput;
		}>,
		reply: FastifyReply,
	) => {
		const { id: repository_id } = req.params;
		const { name, description, visibility } = updateRepositorySchema.parse(
			req.body,
		);

		const dataToUpdate: Partial<RepositoryBasic> = {};

		if (name !== undefined) {
			dataToUpdate.name = name;
		}

		if (description !== undefined) {
			dataToUpdate.description = description;
		}

		if (visibility !== undefined) {
			dataToUpdate.visibility = visibility;
		}

		const updatedRepository = await repositoryService.update(
			repository_id,
			dataToUpdate,
			undefined,
			req.unsignedToken,
		);

		return reply.code(200).send(updatedRepository);
	};

export const deleteRepository =
	(repositoryService: RepositoryRepositoryService) =>
	async (
		req: FastifyRequest<{
			Params: { id: number };
		}>,
		reply: FastifyReply,
	) => {
		const { id: repository_id } = deleteRepositoryParamsSchema.parse(
			req.params,
		);

		await repositoryService.delete(repository_id, undefined, req.unsignedToken);

		return reply.code(204).send();
	};
