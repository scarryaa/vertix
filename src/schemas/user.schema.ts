import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";

const userSchema = z.object({
	email: z.string(),
	password: z.string().min(6),
	name: z.string(),
	username: z.string().min(3),
});

const userResponseSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string(),
});

const loginSchema = z.object({
	email: z
		.string({
			required_error: "Email is required.",
			invalid_type_error: "Email must be a string.",
		})
		.email(),
	password: z.string().min(6),
});

const loginResponseSchema = z.object({
	accessToken: z.string(),
});

export type UserInput = z.infer<typeof userSchema>;
export type LoginUserInput = z.infer<typeof loginSchema>;

export const { schemas: userSchemas, $ref } = buildJsonSchemas(
	{
		userSchema,
		userResponseSchema,
		loginSchema,
		loginResponseSchema,
	},
	{ $id: "userSchema" },
);
