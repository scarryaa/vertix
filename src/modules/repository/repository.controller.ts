import {
	type Issue,
	type Prisma,
	PrismaClient,
	type Repository,
	type Star,
} from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { replyWithError } from "../../util/messages";
import { checkOwnerExists, checkRepositoryExists, isRepositoryNameValid } from "../../util/repository-validation";
import {
	type ValidationError,
	validateAllowedValues,
	validateRange,
	validateType,
} from "../../util/validation";
import type {
	GetRepositoriesInput,
	GetRepositoriesResponse,
	GetRepositoryInput,
	RepositoryInput,
	UpdateRepositoryInput,
} from "./repository.schema";

const prisma = new PrismaClient();

const MAX_DESCRIPTION_LENGTH = 255;


export async function createRepository(
	req: FastifyRequest<{ Body: RepositoryInput }>,
	reply: FastifyReply,
  ) {
	try {
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
  
	  // Create repository using a transaction
	  const newRepository: Repository = await prisma.$transaction(async (prisma) => {
		return prisma.repository.create({
		  data: {
			name,
			visibility,
			description,
			ownerId,
		  },
		});
	  });
  
	  return reply.code(201).send(newRepository);
	} catch (error) {
	  console.error("Error creating repository: ", error);
	  return reply.code(500).send({ message: "Internal Server Error" });
	}
  }

export async function getAllRepositories(
	req: FastifyRequest<{ Querystring: GetRepositoriesInput }>,
	reply: FastifyReply,
) {
    // @TODO check/filter visibility
	try {
		const { limit, page, search, visibility, ownerId } = req.query;

		// Validate the various params (since zod isn't supported here)
		const validations = [
			// visibility can be optional
			visibility
				? validateAllowedValues(visibility, ["public", "private"], "visibility")
				: null,
			// ownerId can be optional
			ownerId
				? validateType(Number(ownerId) || undefined, "number", "ownerId")
				: null,
			// page can be optional
			page
				? validateRange(Number(page), 1, Number.POSITIVE_INFINITY, "page")
				: null,
			page ? validateType(Number(page) || undefined, "number", "page") : null,
			// limit can be optional
			limit ? validateRange(Number(limit), 1, 100, "limit") : null,
			limit
				? validateType(Number(limit) || undefined, "number", "limit")
				: null,
		].filter(Boolean);

		// If there are errors, reply with the first one
		if (validations.length > 0) {
			const firstError = validations.find(
				(validation): validation is ValidationError => validation !== null,
			);

			if (firstError) {
				return replyWithError(reply, firstError.message);
			}
		}

		const whereClause: Prisma.RepositoryWhereInput = {};

		// If we passed validation, we can continue
		const parsedPage = Math.max(1, Number(page) || 1);
		const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
		const parsedOwnerId = ownerId ? Number(ownerId) : undefined;

		if (search) {
			whereClause.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			];
		}

		if (parsedOwnerId !== undefined) {
			whereClause.ownerId = parsedOwnerId;
		}

		const totalCount = await prisma.repository.count({ where: whereClause });

		const repositories = await prisma.repository.findMany({
			where: whereClause,
			take: parsedLimit,
			skip: (parsedPage - 1) * parsedLimit,
		});

		const formattedRepositories = repositories.map((repo) => ({
			...repo,
			visibility: repo.visibility as "public" | "private",
		}));

		// Return generic message if no repositories
		if (totalCount === 0) {
			return reply.code(404).send({ message: "No repositories found" });
		}

		const response: GetRepositoriesResponse = {
			repositories: formattedRepositories,
			totalCount,
			limit: parsedLimit,
			page: parsedPage,
		};

		return reply.code(200).send(response);
	} catch (error) {
		console.error("Error getting repositories: ", error);
		return reply.code(500).send({ message: "Internal Server Error" });
	}
}

export async function getRepository(
	req: FastifyRequest<{ Querystring: { id: GetRepositoryInput } }>,
	reply: FastifyReply,
) {
    // @TODO check repository visibility
	try {
		const { id } = req.query;

		// Validate the various params (since zod isn't supported here)
		const validations = [
			// id is required
			validateRange(Number(id), 1, Number.POSITIVE_INFINITY, "id"),
			validateType(Number(id) || undefined, "number", "id"),
		].filter(Boolean);

		// If there's errors, send the first one
		if (validations.length > 0) {
			const firstError = validations.find(
				(validation): validation is ValidationError => validation !== null,
			);

			if (firstError) {
				return replyWithError(reply, firstError.message);
			}
		}

		// Otherwise, we can proceed
		const repository = await prisma.repository.findUnique({
			where: { id: Number(id) },
		});

		if (!repository) {
			return reply.code(404).send({ message: "Repository not found" });
		}

		return reply.code(200).send(repository);
	} catch (error) {
		console.error("Error getting repository: ", error);
		return reply.code(500).send({ message: "Internal Server Error" });
	}
}

export async function updateRepository(
	req: FastifyRequest<{
		Body: Partial<UpdateRepositoryInput>;
	}>,
	reply: FastifyReply,
) {
    // @TODO check permissions
	try {
		const { id, name, description, visibility, ownerId } = req.body;

		const dataToUpdate: Record<string, any> = {};

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
			return reply
				.code(400)
				.send({ message: "No fields provided for update." });
		}

		const updatedRepository = await prisma.repository.update({
			where: { id: Number(id) },
			data: dataToUpdate,
		});

		return reply.code(200).send(updatedRepository);
	} catch (error) {
		console.error("Error updating repository: ", error);
		return reply.code(500).send({ message: "Internal Server Error" });
	}
}

export async function deleteRepository(
	req: FastifyRequest<{ Body: { id: string } }>,
	reply: FastifyReply,
) {
    // @TODO check permissions
	try {
		const { id } = req.body;

		await prisma.repository.delete({
			where: { id: Number.parseInt(id) },
		});

		return reply.code(204).send();
	} catch (error) {
		console.error("Error deleting repository: ", error);
		return reply.code(500).send({ message: "Internal Server Error" });
	}
}
