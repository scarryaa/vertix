import type { NextFunction, Request, Response } from "express";
import type Joi from "joi";

export const validateRequest = ({
	bodySchema,
	querySchema,
	paramsSchema,
}: {
	bodySchema?: Joi.ObjectSchema;
	querySchema?: Joi.ObjectSchema;
	paramsSchema?: Joi.ObjectSchema;
}) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const errors = [];

		if (bodySchema) {
			const { error } = bodySchema.validate(req.body);
			if (error && Array.isArray(error.details)) {
				errors.push(...error.details.map((detail) => detail.message));
			} else if (error) {
				errors.push(error.message);
			}
		}

		if (querySchema) {
			const { error } = querySchema.validate(req.query);
			if (error && Array.isArray(error.details)) {
				errors.push(...error.details.map((detail) => detail.message));
			} else if (error) {
				errors.push(error.message);
			}
		}

		if (paramsSchema) {
			const { error } = paramsSchema.validate(req.params);
			if (error && Array.isArray(error.details)) {
				errors.push(...error.details.map((detail) => detail.message));
			} else if (error) {
				errors.push(error.message);
			}
		}

		if (errors.length > 0) {
			return res.status(400).send({ errors });
		}

		next();
	};
};
