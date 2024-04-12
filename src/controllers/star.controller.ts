import type { FastifyReply, FastifyRequest } from "fastify";
import {
	type StarInput,
	type StarResponse,
	createStarSchema,
	deleteStarParamsSchema,
	getStarSchema,
} from "../schemas/star.schema";
import type { StarService } from "../services/star.service";
import { StarNotFoundError } from "../utils/errors/star.error";

export const createStar =
	(starService: StarService) =>
	async (
		req: FastifyRequest<{ Body?: StarInput }>,
		reply: FastifyReply,
	): Promise<StarResponse> => {
		const { repositoryId } = createStarSchema.parse(req.body);

		const newStar = await starService.createStar(
			{
				repositoryId,
				// @TODO fix this ??
				userId: req.user?.userId ?? "",
			},
			req.unsignedToken,
		);

		return reply.code(201).send(newStar);
	};

export const getStarById =
	(starService: StarService) =>
	async (
		req: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) => {
		const { id } = getStarSchema.parse(req.params);

		const star = await starService.getStarById(id);

		if (!star) {
			throw new StarNotFoundError();
		}

		return reply.code(200).send(star);
	};

export const deleteStar =
	(starService: StarService) =>
	async (
		req: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) => {
		const { id } = deleteStarParamsSchema.parse(req.params);

		await starService.deleteStar(id, req.unsignedToken);

		return reply.code(204).send();
	};
