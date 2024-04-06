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

const supportedFieldsForUpdate = [
	"name",
	"description",
	"visibility",
	"ownerId",
];
const MAX_DESCRIPTION_LENGTH = 255;

export async function createRepository(
	req: FastifyRequest<{ Body: RepositoryInput }>,
	reply: FastifyReply,
) {
	const { name, ownerId, description, visibility } = req.body;

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
	const newRepository: RepositoryBasic = await repositoryService.create(
		ownerId,
		{
			name,
			description,
			visibility,
		},
	);

	return reply.code(201).send(newRepository);
}

export async function getAllRepositories(
	req: FastifyRequest<{ Querystring: GetRepositoriesInput }>,
	reply: FastifyReply,
) {
	// @TODO check/filter visibility
	const { limit, page, search, visibility, ownerId, skip } = req.query;

	// Validate the various params (since zod isn't supported here)
	const validations = [
		// visibility can be optional
		visibility
			? validateAllowedValues(visibility, ["public", "private"], "visibility")
			: null,
		// ownerId can be optional
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
	const parsedPage = Math.max(1, Number(page) || 1);
	const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
	const parsedOwnerId = ownerId ? Number(ownerId) : undefined;
	const parsedSkip = skip !== undefined ? skip : (parsedPage - 1) * parsedLimit;

	const { repositories, totalCount } = await repositoryService.getAll({
		limit: parsedLimit,
		ownerId: parsedOwnerId,
		page: parsedPage,
		search: search,
		skip: parsedSkip,
		visibility: visibility,
	});

	// Check if repositories is empty
	if (totalCount === 0 || repositories === null) {
		throw new NotFoundError("No repositories found");
	}

	const response: GetRepositoriesResponse = {
		repositories: repositories.map((repo: any) => ({
			...repo,
			description: repo.description ?? null,
			visibility: repo.visibility as "public" | "private",
		})),
		totalCount,
		page: parsedPage,
		limit: parsedLimit,
	};

	return reply.code(200).send(response);
}

export async function getRepository(
	req: FastifyRequest<{ Querystring: { id: GetRepositoryInput } }>,
	reply: FastifyReply,
) {
	// @TODO check repository visibility
	const { id } = req.query;

	// Validate the various params (since zod isn't supported here)
	const validations = [
		// id is required
		validateRange(Number(id), 1, Number.POSITIVE_INFINITY, "id"),
		validateType(Number(id) || undefined, 0, "id"),
	];

	handleValidations(reply, validations);

	// Otherwise, we can proceed
	const repository = await repositoryService.findById(Number(id));

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
	// only owners of the repo can update
	const { id, name, description, visibility, ownerId } = req.body;

	const idNum = Number(id);
	const ownerIdNum = Number(ownerId);

	const validations = [
		validateRange(idNum, 1, Number.POSITIVE_INFINITY, "id"),
		validateType(idNum ?? undefined, 0, "id"),
		validateRange(ownerIdNum, 1, Number.POSITIVE_INFINITY, "ownerId"),
		validateType(ownerIdNum ?? undefined, 0, "ownerId"),
	];

	handleValidations(reply, validations);

	// If validated, we can continue
	const dataToUpdate: Record<string, unknown> = {};

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
		dataToUpdate.ownerId = ownerId;
	}

	if (Object.keys(dataToUpdate).length === 0) {
		return reply.code(400).send({
			message: `No fields provided for update. Supported fields are: ${supportedFieldsForUpdate.join(
				", ",
			)}`,
		});
	}

	const updatedRepository = await repositoryService.update(
		Number(id),
		Number(ownerId),
		dataToUpdate,
	);

	return reply.code(200).send(updatedRepository);
}

export async function deleteRepository(
	req: FastifyRequest<{ Body: { id: string; userId: string } }>,
	reply: FastifyReply,
) {
	const { id, userId } = req.body;

	const idNum = Number(id);
	const userIdNum = Number(userId);

	const validations = [
		validateRange(idNum, 1, Number.POSITIVE_INFINITY, "id"),
		validateType(idNum || undefined, 0, "id"),
		validateRange(userIdNum, 1, Number.POSITIVE_INFINITY, "userId"),
		validateType(userIdNum || undefined, 0, "userId"),
	];

	handleValidations(reply, validations);

	await repositoryService.delete(Number(id), Number(userId));

	return reply.code(204).send();
}
