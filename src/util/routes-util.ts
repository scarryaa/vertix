import type { Response } from "express";
import { StatusCodes } from "http-status-codes";

export const sendSuccessResponse = <T>(res: Response, data: T) => {
	res.status(StatusCodes.OK).json({ data });
};

export const sendErrorResponse = (
	res: Response,
	error: string | object,
	statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
) => {
	res.status(statusCode).json({ error });
};

export const sendCreatedResponse = <T>(
	res: Response,
	data: T,
	location?: string,
) => {
	const response = res.status(StatusCodes.CREATED);
	if (location) {
		response.location(location);
	}
	response.json({ data });
};

export const sendNoContentResponse = (res: Response) => {
	res.status(StatusCodes.NO_CONTENT).send();
};

export const sendUnauthorizedResponse = (res: Response) => {
	res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
};

export const sendForbiddenResponse = (res: Response) => {
	res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden" });
};

export const sendNotFoundResponse = (res: Response) => {
	res
		.status(StatusCodes.NOT_FOUND)
		.json({ message: "The requested resource does not exist." });
};
