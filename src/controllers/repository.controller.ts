import type { FastifyReply, FastifyRequest } from "fastify";
import type { RepositoryBasic } from "../models";
import type {
	GetRepositoriesInput,
	GetRepositoriesResponse,
	GetRepositoryInput,
	RepositoryInput,
	UpdateRepositoryInput,
} from "../schemas/repository.schema";
import { repositoryRepositoryService } from "../services";
import {
	InvalidRepositoryNameError,
	InvalidTokenError,
	MissingTokenError,
	RepositoryAlreadyExistsError,
	RepositoryNotFoundError,
} from "../utils/errors";
import { UserDoesNotExistError } from "../utils/errors/user.error";
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

const MAX_DESCRIPTION_LENGTH = 255;

export async function createRepository(
	req: FastifyRequest<{ Body: RepositoryInput }>,
	reply: FastifyReply,
) {
	// Get params and check auth
	const { name, owner_id, description, visibility } = req.body;
	const authToken = req.cookies.access_token;

	if (!authToken) {
		throw new MissingTokenError();
	}

	// Validate input data
	if (!isRepositoryNameValid(name)) {
		throw new InvalidRepositoryNameError();
	}

	// Check if repository already exists
	if (await checkRepositoryExists(name, owner_id)) {
		throw new RepositoryAlreadyExistsError();
	}

	// Check if owner exists
	if (!(await checkOwnerExists(owner_id))) {
		throw new UserDoesNotExistError(" ");
	}

	// Create repository
	const unsignedToken = reply.unsignCookie(authToken).value;
	if (!unsignedToken) {
		throw new InvalidTokenError();
	}
	const newRepository: RepositoryBasic =
		await repositoryRepositoryService.create(
			{
				name,
				description,
				visibility,
				owner_id: owner_id,
			},
			unsignedToken,
		);

	return reply.code(201).send(newRepository);
}

export async function getAllRepositories(
	req: FastifyRequest<{ Querystring: GetRepositoriesInput }>,
	reply: FastifyReply,
) {
	const { limit, page, search, visibility, owner_id, skip } = req.query;

	// Validate the various params (since zod isn't supported here)
	const validations = [
		// visibility can be optional
		visibility
			? validateAllowedValues(visibility, ["public", "private"], "visibility")
			: null,
		// owner_id can be optional
		owner_id ? validateType(Number(owner_id) || undefined, 0, "ownerId") : null,
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
	const repositories = await repositoryRepositoryService.getAll({
		limit: Number(limit),
		page: Number(page),
		search: {},
		skip,
	});

	// Check if repositories is empty
	if (repositories.length === 0) {
		throw new RepositoryNotFoundError("No repositories found.");
	}

	const response: GetRepositoriesResponse = {
		repositories: repositories.map((repo) => ({
			...repo,
			description: repo.description ?? null,
			visibility: repo.visibility as "public" | "private",
			ownerId: Number(owner_id),
			createdAt: new Date(),
			updatedAt: new Date(),
		})),
		total_count: repositories.length,
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
	const repository = await repositoryRepositoryService.getById(Number(id));

	if (!repository) {
		throw new RepositoryNotFoundError();
	}

	return reply.code(200).send(repository);
}

export async function updateRepository(
	req: FastifyRequest<{
		Body: Partial<UpdateRepositoryInput>;
	}>,
	reply: FastifyReply,
) {
	const { id, name, description, visibility, owner_id } = req.body;
	const authToken = req.cookies.access_token;

	if (!authToken) throw new MissingTokenError();

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

	if (owner_id !== undefined) {
		dataToUpdate.owner_id = owner_id;
	}

	const unsignedToken = reply.unsignCookie(authToken).value;
	if (!unsignedToken) {
		throw new InvalidTokenError();
	}

	const updatedRepository = await repositoryRepositoryService.update(
		Number(id),
		dataToUpdate,
		unsignedToken,
	);

	return reply.code(200).send(updatedRepository);
}

export async function deleteRepository(
	req: FastifyRequest<{ Body: { id: number } }>,
	reply: FastifyReply,
) {
	const { id } = req.body;
	const authToken = req.cookies.access_token;

	if (!authToken) throw new MissingTokenError();

	const validations = [
		validateRange(Number(id), 1, Number.POSITIVE_INFINITY, "id"),
		validateType(Number(id) || undefined, 0, "id"),
	];

	handleValidations(reply, validations);

	const unsignedToken = reply.unsignCookie(authToken).value;
	if (!unsignedToken) {
		throw new InvalidTokenError();
	}

	await repositoryRepositoryService.delete(Number(id), unsignedToken);

	return reply.code(204).send();
}
