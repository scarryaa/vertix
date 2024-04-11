import { buildJsonSchemas } from "fastify-zod";
import z, { any } from "zod";

const createRepositorySchema = z.object({
	name: z.string().max(64).min(3),
	description: z.string().max(255).optional(),
	visibility: z.enum(["public", "private"]),
});

const createRepositoryReponseSchema = z.object({
	id: z.string(),
	name: z.string().max(64).min(3),
	owner_id: z.string(),
	description: z.string().nullable(),
	visibility: z.enum(["public", "private"]),
	created_at: z.date(),
	updated_at: z.date(),
});

export type RepositoryInput = z.infer<typeof createRepositorySchema>;
export type RepositoryResponse = z.infer<typeof createRepositoryReponseSchema>;

const getRepositoriesSchema = z.object({
	take: z.coerce.number().min(1).max(100).optional().default(20),
	cursor: z.coerce.number().min(1).optional(),
	search: z.string().optional(),
	visibility: z.enum(["public", "private"]).optional(),
	id: z.string().optional(),
	skip: z.coerce.number().min(0).optional(),
	where: any(),
});

const getRepositoriesResponseSchema = z.object({
	repositories: z.array(createRepositoryReponseSchema),
	total_count: z.coerce.number().min(0).max(100),
	take: z.coerce.number().min(1).max(100),
	cursor: z.coerce.number().min(1),
});

export type GetRepositoriesInput = z.infer<typeof getRepositoriesSchema> & {
	cursor?: { id: string };
};
export type GetRepositoriesResponse = z.infer<
	typeof getRepositoriesResponseSchema
>;

const getRepositorySchema = z.object({
	id: z.string(),
});

const getRepositoryResponseSchema = createRepositoryReponseSchema;

export type GetRepositoryInput = z.infer<typeof getRepositorySchema>;
export type GetRepositoryResponse = z.infer<typeof getRepositoryResponseSchema>;

const updateRepositoryParamsSchema = z.object({
	id: z.string(),
});

const updateRepositorySchema = z
	.object({
		name: z.string().max(64).min(3).optional(),
		description: z.string().max(255).optional(),
		visibility: z.enum(["public", "private"]).optional(),
	})
	.refine(
		(data) => data.name || data.description || data.visibility,
		"At least one of name, description, or visibility must be provided",
	);

const updateRepositoryResponseSchema = z.object({
	id: z.string(),
	name: z.string().max(64).min(3),
	description: z.string().max(255).optional(),
	visibility: z.enum(["public", "private"]).optional(),
	owner_id: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
});

export type UpdateRepositoryParams = z.infer<
	typeof updateRepositoryParamsSchema
>;
export type UpdateRepositoryInput = z.infer<typeof updateRepositorySchema>;
export type UpdateRepositoryResponse = z.infer<
	typeof updateRepositoryResponseSchema
>;

const deleteRepositoryQuerySchema = z.object({
	owner_id: z.string(),
});

const deleteRepositoryParamsSchema = z.object({
	id: z.string(),
});

export type DeleteRepositoryQuery = z.infer<typeof deleteRepositoryQuerySchema>;
export type DeleteRepositoryParams = z.infer<
	typeof deleteRepositoryParamsSchema
>;

export {
	createRepositorySchema,
	createRepositoryReponseSchema,
	getRepositorySchema,
	getRepositoryResponseSchema,
	getRepositoriesSchema,
	getRepositoriesResponseSchema,
	updateRepositoryParamsSchema,
	updateRepositorySchema,
	updateRepositoryResponseSchema,
	deleteRepositoryParamsSchema,
	deleteRepositoryQuerySchema,
};

export const { schemas: repositorySchemas, $ref } = buildJsonSchemas(
	{
		createRepository: createRepositorySchema,
		createRepositoryResponse: createRepositoryReponseSchema,
		getRepositories: getRepositoriesSchema,
		getRepositoriesResponse: getRepositoriesResponseSchema,
		getRepository: getRepositorySchema,
		getRepositoryResponse: getRepositoryResponseSchema,
		updateRepositoryParamsSchema: updateRepositoryParamsSchema,
		updateRepository: updateRepositorySchema,
		updateRepositoryResponse: updateRepositoryResponseSchema,
		deleteRepositoryParams: deleteRepositoryParamsSchema,
		deleteRepositoryQuery: deleteRepositoryQuerySchema,
	},
	{ $id: "repositorySchemas" },
);
