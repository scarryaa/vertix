import { buildJsonSchemas } from "fastify-zod";
import z from "zod";

export const createStarSchema = z.object({
	repository_id: z.coerce.number().min(1),
});

export const createStarResponseSchema = z.object({
	id: z.coerce.number().min(1),
	repository_id: z.coerce.number().min(1),
	user_id: z.coerce.number().min(1),
	created_at: z.date(),
	updated_at: z.date(),
});

export const getStarSchema = z.object({
	id: z.coerce.number().min(1),
});

export const getStarResponseSchema = createStarResponseSchema;

export type StarInput = z.infer<typeof createStarSchema>;
export type StarResponse = z.infer<typeof createStarResponseSchema>;

export const deleteStarParamsSchema = z.object({
	id: z.coerce.number().min(1),
});

export const deleteStarQuerySchema = z.object({
	owner_id: z.coerce.number().min(1),
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
