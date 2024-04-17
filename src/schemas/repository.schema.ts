import Joi from "joi";

const name = Joi.string()
	.regex(/^[a-zA-Z0-9-_]+$/)
	.min(1)
	.max(64)
	.error(
		() =>
			new Error(
				"Name must be in the format of a-z, A-Z, 0-9, -, or _. E.g. my-awesome-repo",
			),
	);

export const createRepositorySchema = Joi.object({
	// Can only have dashes, letters, numbers, and underscores
	name: name.required(),
	description: Joi.string().min(1).max(255),
	private: Joi.boolean().required(),
});

export const updateRepositorySchema = Joi.object({
	id: Joi.string().uuid().required(),
	name,
	description: Joi.string().min(1).max(255),
	private: Joi.boolean(),
}).or("name", "description", "private");

export const getRepositorySchema = Joi.object({
	repositoryId: Joi.string().uuid().required(),
});

export const deleteRepositorySchema = Joi.object({
	id: Joi.string().uuid().required(),
});
