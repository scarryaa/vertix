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
			const newRepository = await repositoryService.createRepositoryWithFile(
				{ name, description: description ?? null, visibility },
				"test file content",
				req.unsignedToken,
			);
			reply.code(201).send(newRepository);
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
						repo?.owner_id &&
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
						owner_id: repo.owner_id ?? "",
						created_at: repo.created_at ?? new Date(),
						updated_at: repo.updated_at ?? new Date(),
					};
					return mapRepositoryResponse(
						refinedRepo,
						refinedRepo.owner_id,
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

		// Otherwise, we can proceed
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
	(repositoryService: RepositoryCommandService) =>
	async (
		req: FastifyRequest<{
			Params: { id: string };
		}>,
		reply: FastifyReply,
	) => {
		const { id: repository_id } = deleteRepositoryParamsSchema.parse(
			req.params,
		);

		await repositoryService.delete(repository_id, undefined, req.unsignedToken);

		return reply.code(204).send();
	};
