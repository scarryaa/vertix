import Joi from "joi";

// Require at least one uppercase letter, one lowercase letter, and one number
const password = Joi.string()
	.regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
	.min(8)
	.error(
		() =>
			new Error(
				"Password must be at least 8 characters long and contain at least one number, one uppercase letter, and one lowercase letter",
			),
	);

// No space allowed
const username = Joi.string()
	.regex(/^[a-zA-Z0-9]+$/)
	.min(3)
	.max(30)
	.error(
		() =>
			new Error(
				"Username must be at least 3 characters long and contain only letters and numbers",
			),
	);

export const createUserSchema = Joi.object({
	username: username.required(),
	password: password.required(),
	email: Joi.string().email().required(),
	name: Joi.string().required().min(1),
});

export const getUserSchema = Joi.object({
	userId: Joi.string().required(),
});

export const getAllUsersSchema = Joi.object({});

export const updateUserSchema = Joi.object({
	userId: Joi.string().required(),
	username: username,
	password: password,
	email: Joi.string().email(),
	name: Joi.string().min(1),
}).or("username", "password", "email", "name");

export const loginUserSchema = Joi.object({
	username: Joi.string().required(),
    password: Joi.string().required(),
});

export const deleteUserSchema = Joi.object({
	deletionToken: Joi.string().required().uuid(),
});