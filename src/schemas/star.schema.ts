import { buildJsonSchemas } from "fastify-zod";
import z from "zod";

export const createStarSchema = z.object({
	repositoryId: z.string(),
});

export const createStarResponseSchema = z.object({
	id: z.string(),
	repositoryId: z.string(),
	userId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const getStarSchema = z.object({
	id: z.string(),
});

export const getStarResponseSchema = createStarResponseSchema;

export type StarInput = z.infer<typeof createStarSchema>;
export type StarResponse = z.infer<typeof createStarResponseSchema>;

export const deleteStarParamsSchema = z.object({
	id: z.string(),
});

export const deleteStarQuerySchema = z.object({
	ownerId: z.string(),
});

export type DeleteStarParams = z.infer<typeof deleteStarParamsSchema>;
export type DeleteStarQuery = z.infer<typeof deleteStarQuerySchema>;

export const { schemas: starSchemas, $ref } = buildJsonSchemas(
	{
		createStar: createStarSchema,
		createStarResponse: createStarResponseSchema,
		getStar: getStarSchema,
		getStarResponse: getStarResponseSchema,
		deleteStarParams: deleteStarParamsSchema,
		deleteStarQuery: deleteStarQuerySchema,
	},
	{ $id: "starSchemas" },
);
