import { buildJsonSchemas } from "fastify-zod";
import z from "zod";

const repositorySchema = z.object({
	name: z.string(),
	ownerId: z.number(),
	description: z.string().max(255).optional(),
	visibility: z.enum(["public", "private"]),
});

const repositoryResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	ownerId: z.number(),
	description: z.string().nullable(),
	visibility: z.enum(["public", "private"]),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type RepositoryInput = z.infer<typeof repositorySchema>;
export type RepositoryResponse = z.infer<typeof repositoryResponseSchema>;

const getRepositoriesSchema = z.object({
	limit: z
		.string()
		.min(1)
		.max(100, { message: "Limit must be less than or equal to 100!" })
		.optional()
		.default("20"),
	page: z.string().min(1).optional().default("1"),
	search: z.string().optional(),
	visibility: z.enum(["public", "private"]).optional(),
	ownerId: z.string().optional(),
	skip: z.number().optional(),
});

const getRepositoriesResponseSchema = z.object({
	repositories: z.array(repositoryResponseSchema),
	totalCount: z.number(),
	limit: z.number(),
	page: z.number(),
});

export type GetRepositoriesInput = z.infer<typeof getRepositoriesSchema>;
export type GetRepositoriesResponse = z.infer<
	typeof getRepositoriesResponseSchema
>;

const getRepositorySchema = z.object({
	id: z.string().min(0),
});

const getRepositoryResponseSchema = repositoryResponseSchema;

export type GetRepositoryInput = z.infer<typeof getRepositorySchema>;
export type GetRepositoryResponse = z.infer<typeof getRepositoryResponseSchema>;

const updateRepositorySchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	description: z.string().max(255).optional(),
	visibility: z.enum(["public", "private"]).optional(),
	ownerId: z.number().optional(),
});

const updateRepositoryResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional(),
	visibility: z.string(),
	ownerId: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type UpdateRepositoryInput = z.infer<typeof updateRepositorySchema>;
export type UpdateRepositoryResponse = z.infer<
	typeof updateRepositoryResponseSchema
>;

const deleteRepositorySchema = z.object({
	id: z.string({
		required_error: "id is required.",
		invalid_type_error: "id must be a number.",
	}),
});

export type DeleteRepositoryInput = z.infer<typeof deleteRepositorySchema>;

export const { schemas: repositorySchemas, $ref } = buildJsonSchemas(
	{
		repository: repositorySchema,
		repositoryResponse: repositoryResponseSchema,
		getRepositories: getRepositoriesSchema,
		getRepositoriesResponse: getRepositoriesResponseSchema,
		getRepository: getRepositorySchema,
		getRepositoryResponse: getRepositoryResponseSchema,
		updateRepository: updateRepositorySchema,
		updateRepositoryResponse: updateRepositoryResponseSchema,
		deleteRepository: deleteRepositorySchema,
	},
	{ $id: "repositorySchemas" },
);
