import assert from "node:assert";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { RepositoryBasic } from "../models";
import type {
	GetRepositoriesInput,
	GetRepositoriesResponse,
	GetRepositoryInput,
	RepositoryInput,
	UpdateRepositoryInput,
} from "../schemas/repository.schema";
import { repositoryService } from "../services";
import { NotFoundError } from "../utils/errors/not-found.error";
import {
	checkRepositoryExists,
	isRepositoryNameValid,
} from "../utils/repository-validation";
import { checkOwnerExists } from "../utils/user-validation";
import {
	handleValidations,
	validateAllowedValues,
	validateRange,
	validateType,
} from "../utils/validation";

const supportedFieldsForUpdate: (keyof RepositoryBasic)[] = [
	"name",
	"description",
	"visibility",
	"owner_id",
];
const MAX_DESCRIPTION_LENGTH = 255;

export async function createRepository(
	req: FastifyRequest<{ Body: RepositoryInput }>,
	reply: FastifyReply,
) {
	// Get params and check auth
	const { name, ownerId, description, visibility } = req.body;
	const authToken = req.cookies.access_token;
	if (!authToken) {
		return reply.status(401).send({ message: "Authentication required." });
	}

	// Validate input data
	if (!isRepositoryNameValid(name)) {
		return reply.code(400).send({ message: "Invalid repository name" });
	}

	// Check if repository already exists
	if (await checkRepositoryExists(name, ownerId)) {
		return reply.code(409).send({
			message: "Repository with this name and owner already exists",
		});
	}

	// Check if owner exists
	if (!(await checkOwnerExists(ownerId))) {
		return reply.code(404).send({
			message: "Owner with provided id does not exist",
		});
	}

	// Create repository
	const unsignedToken = reply.unsignCookie(authToken).value;
	assert(unsignedToken, "Unsigned cookie token is invalid!");
	const newRepository: RepositoryBasic = await repositoryService.create(
		{
			name,
			description,
			visibility,
			owner_id: ownerId,
		},
		unsignedToken,
	);

	return reply.code(201).send(newRepository);
}

export async function getAllRepositories(
	req: FastifyRequest<{ Querystring: GetRepositoriesInput }>,
	reply: FastifyReply,
) {
	const { limit, page, search, visibility, ownerId, skip } = req.query;

	// Validate the various params (since zod isn't supported here)
	const validations = [
		// visibility can be optional
		visibility
			? validateAllowedValues(visibility, ["public", "private"], "visibility")
			: null,
		// owner_id can be optional
		ownerId ? validateType(Number(ownerId) || undefined, 0, "ownerId") : null,
		// page can be optional
		page
			? validateRange(Number(page), 1, Number.POSITIVE_INFINITY, "page")
			: null,
		page ? validateType(Number(page) || undefined, 0, "page") : null,
		// limit can be optional
		limit ? validateRange(Number(limit), 1, 100, "limit") : null,
		limit ? validateType(Number(limit) || undefined, 0, "limit") : null,
	];

	handleValidations(reply, validations);

	// If we passed validation, we can continue
	const repositories = await repositoryService.getAll({
		limit: Number(limit),
		page: Number(page),
		search: {},
		skip,
	});

	// Check if repositories is empty
	if (repositories.length === 0) {
		throw new NotFoundError("No repositories found");
	}

	const response: GetRepositoriesResponse = {
		repositories: repositories.map((repo) => ({
			...repo,
			description: repo.description ?? null,
			visibility: repo.visibility as "public" | "private",
			ownerId: Number(ownerId),
			createdAt: new Date(),
			updatedAt: new Date(),
		})),
		totalCount: repositories.length,
		page: Number(page) || 1,
		limit: Number(limit) || 20,
	};

	return reply.code(200).send(response);
}

export async function getRepository(
	req: FastifyRequest<{ Params: { id: GetRepositoryInput } }>,
	reply: FastifyReply,
) {
	const { id } = req.params;

	// Validate the various params (since zod isn't supported here)
	const validations = [
		// id is required
		validateRange(Number(id), 1, Number.POSITIVE_INFINITY, "id"),
		validateType(Number(id) || undefined, 0, "id"),
	];

	handleValidations(reply, validations);

	// Otherwise, we can proceed
	const repository = await repositoryService.getById(Number(id));

	if (!repository) {
		return reply.code(404).send({ message: "Repository not found" });
	}

	return reply.code(200).send(repository);
}

export async function updateRepository(
	req: FastifyRequest<{
		Body: Partial<UpdateRepositoryInput>;
	}>,
	reply: FastifyReply,
) {
	const { id, name, description, visibility, ownerId } = req.body;

	const validations = [
		validateRange(Number(id), 1, Number.POSITIVE_INFINITY, "id"),
		validateType(Number(id), 0, "id"),
	];

	handleValidations(reply, validations);

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

	if (ownerId !== undefined) {
		dataToUpdate.owner_id = ownerId;
	}

	const updatedRepository = await repositoryService.update(
		Number(id),
		dataToUpdate,
		req.headers.authorization || "",
	);

	return reply.code(200).send(updatedRepository);
}

export async function deleteRepository(
	req: FastifyRequest<{ Body: { id: number } }>,
	reply: FastifyReply,
) {
	const { id } = req.body;

	const validations = [
		validateRange(Number(id), 1, Number.POSITIVE_INFINITY, "id"),
		validateType(Number(id) || undefined, 0, "id"),
	];

	handleValidations(reply, validations);

	await repositoryService.delete(Number(id), req.headers.authorization || "");

	return reply.code(204).send();
}
