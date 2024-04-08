import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";

// User input schemas
export const createUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string(),
	username: z.string().min(3),
});

export const loginUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const updateUserSchema = z.object({
	email: z.string().email().optional(),
	password: z.string().min(6).optional(),
	name: z.string().optional(),
	username: z.string().min(3).optional(),
});

// User response schemas
export const userResponseSchema = z.object({
	id: z.coerce.number().min(1),
	email: z.string(),
	name: z.string(),
	username: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
});

export const loginResponseSchema = z.object({
	accessToken: z.string(),
});

// User query schemas
export const getUserQuerySchema = z.object({
	id: z.coerce.number().min(1),
});

export const getUsersQuerySchema = z.object({
	cursor: z.coerce.number().optional(),
	take: z.coerce.number().optional(),
	search: z.string().optional(),
	skip: z.number().optional(),
});

export const updateUserParamsSchema = z.object({
	id: z.coerce.number().min(1),
});

// User delete schemas
const deleteUserParamsSchema = z.object({
	id: z.coerce.number().min(1),
});

export type CreateUser = z.infer<typeof createUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type GetUserQuery = z.infer<typeof getUserQuerySchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

export const { schemas: userSchemas, $ref } = buildJsonSchemas(
	{
		createUserSchema,
		userResponseSchema,
		loginUserSchema,
		loginResponseSchema,
		updateUserSchema,
		getUserQuerySchema,
		getUsersQuerySchema,
		deleteUserParamsSchema,
		updateUserParamsSchema,
	},
	{ $id: "userSchema" },
);
