import {
	type Issue,
	type Prisma,
	PrismaClient,
	type Repository,
	type Star,
} from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { replyWithError } from "../../util/messages";
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

        // Check if repository already exists
        const existingRepository = await prisma.repository.findFirst({
            where: {
                AND: [{ name: name }, { ownerId: ownerId }],
            },
        });

        // If it already exists, return error response
        if (existingRepository) {
            return reply.code(409).send({
                message: "Repository with this name and owner already exists.",
            });
        }

        // Check if owner exists
        const owner = await prisma.user.findFirst({ where: { id: ownerId } });
        if (!owner) {
            return reply.code(404).send({
                message: "User with provided id does not exist.",
            });
        }

        // Proceed to create repository
        const newRepository: Repository = await prisma.repository.create({
            data: {
                name: name,
                visibility: visibility,
                description: description,
                ownerId: ownerId,
            },
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
