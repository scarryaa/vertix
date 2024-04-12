import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { RepositoryBasic, TVisibility } from "../models";
import {
	type GetRepositoriesInput,
	type GetRepositoriesResponse,
	type GetRepositoryInput,
	type RepositoryInput,
	type UpdateRepositoryInput,
	createRepositorySchema,
	deleteRepositoryParamsSchema,
	getRepositoriesSchema,
	getRepositorySchema,
	updateRepositorySchema,
} from "../schemas/repository.schema";
import type { RepositoryCommandService } from "../services/repository/repository-command.service";
import type { RepositoryQueryService } from "../services/repository/repository-query.service";
import { RepositoryNotFoundError } from "../utils/errors";
import { mapRepositoryResponse } from "../utils/repository-validation";

export const createRepository =
	(repositoryService: RepositoryCommandService) =>
	async (
		req: FastifyRequest<{ Body?: RepositoryInput }>,
		reply: FastifyReply,
	): Promise<void> => {
		try {
			const { name, description, visibility } = createRepositorySchema.parse(
				req.body,
			);

			await repositoryService.create(
				{ name, description: description ?? null, visibility, id: randomUUID() },
				req.unsignedToken,
			);

			reply.code(201).send();
		} catch (error) {
			// @TODO differentiate between error types
			console.error(error);
			reply.code(500).send({ message: "Internal Server Error" });
		}
	};

export const getAllRepositories =
	(repositoryService: RepositoryQueryService) =>
	async (
		req: FastifyRequest<{ Querystring: GetRepositoriesInput }>,
		reply: FastifyReply,
	) => {
		const { cursor, take, id, search, skip, visibility } =
			getRepositoriesSchema.parse(req.query);

		const fetchedRepositories = await repositoryService.getAll(
			{
				take,
				cursor: { id: cursor ?? 0 },
				where: {
					visibility,
					id,
				},
				skip,
				search,
			},
			true,
		);

		if (
			fetchedRepositories?.length === 0 ||
			fetchedRepositories === undefined
		) {
			throw new RepositoryNotFoundError("No repositories found.");
		}

		const response: GetRepositoriesResponse = {
			repositories: fetchedRepositories
				.filter(
					(repo) =>
						repo?.ownerId &&
						repo.created_at &&
						repo.updated_at &&
						repo.visibility,
				)
				.map((repo) => {
					// Assume all properties are defined after filtering
					const refinedRepo: RepositoryBasic = {
						id: repo.id ?? "",
						name: repo.name ?? "",
						description: repo.description ?? "",
						visibility: repo.visibility as TVisibility,
						ownerId: repo.ownerId ?? "",
						created_at: repo.created_at ?? new Date(),
						updated_at: repo.updated_at ?? new Date(),
					};
					return mapRepositoryResponse(
						refinedRepo,
						refinedRepo.ownerId,
						refinedRepo.created_at,
						refinedRepo.updated_at,
						refinedRepo.visibility,
					);
				}),
			total_count: fetchedRepositories?.length ?? 0,
			cursor: cursor ?? 1,
			take,
		};

		return reply.code(200).send(response);
	};

export const getRepository =
	(repositoryService: RepositoryQueryService) =>
	async (
		req: FastifyRequest<{ Querystring: { id: GetRepositoryInput } }>,
		reply: FastifyReply,
	) => {
		const { id } = getRepositorySchema.parse(req.query);

		const repository = await repositoryService.getById(id);

		if (!repository) {
			throw new RepositoryNotFoundError();
		}

		return reply.code(200).send(repository);
	};

export const updateRepository =
	(repositoryService: RepositoryCommandService) =>
	async (
		req: FastifyRequest<{
			Params: { id: string };
			Body: UpdateRepositoryInput;
		}>,
		reply: FastifyReply,
	) => {
		const { id: repositoryId } = req.params;
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
			repositoryId,
			dataToUpdate,
			undefined,
			req.unsignedToken,
		);

		return reply.code(200).send(updatedRepository);
	};

export const deleteRepository =
	(repositoryService: RepositoryCommandService) =>
	async (
		req: FastifyRequest<{
			Params: { id: string };
		}>,
		reply: FastifyReply,
	) => {
		const { id: repositoryId } = deleteRepositoryParamsSchema.parse(req.params);

		await repositoryService.delete(repositoryId, undefined, req.unsignedToken);

		return reply.code(204).send();
	};
