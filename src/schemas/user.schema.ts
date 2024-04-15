import Joi from "joi";

const password = Joi.string()
	.regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
	.required()
	.error(
		() =>
			new Error(
				"Password must be at least 8 characters long and contain at least one number, one uppercase letter, and one lowercase letter",
			),
	);

export const createUserSchema = Joi.object({
	username: Joi.string().required().min(3).max(30),
	// Require at least one uppercase letter, one lowercase letter, and one number
	password: password,
	email: Joi.string().email().required(),
	name: Joi.string().required().min(1),
});

export const deleteUserSchema = Joi.object({
	userId: Joi.string().required(),
});

export const getUserSchema = Joi.object({
	userId: Joi.string().required(),
});

export const getAllUsersSchema = Joi.object({});

export const updateUserSchema = Joi.object({
	userId: Joi.string().required(),
	username: Joi.string().min(3).max(30),
	// Require at least one uppercase letter, one lowercase letter, and one number
	password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/),
	email: Joi.string().email(),
	name: Joi.string().min(1),
}).or("username", "password", "email", "name");
