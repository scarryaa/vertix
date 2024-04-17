import { Router } from "express";
import { CreateRepositoryCommand } from "../commands/repository/handlers/create-repository.command";
import { CreateRepositoryCommandHandler } from "../commands/repository/handlers/create-repository.command.handler";
import { UpdateRepositoryCommandHandler } from "../commands/repository/handlers/update-repository.command.handler";
import { RepositoryController } from "../controllers/repository.controller";
import { EventStore } from "../events/store.event";
import { asyncHandler } from "../middleware/async-handler";
import { jwtMiddleware } from "../middleware/jwt";
import { validateRequest } from "../middleware/validation";
import { GetRepositoryQuery } from "../queries/repository/get-repository.query";
import { GetAllRepositoriesQueryHandler } from "../queries/repository/handlers/get-all-repositories.query.handler";
import { GetRepositoryQueryHandler } from "../queries/repository/handlers/get-repository.query.handler";
import {
	createRepositorySchema,
	getRepositorySchema,
	updateRepositorySchema,
} from "../schemas/repository.schema";
import { generateUuid } from "../util";
import { sendNotFoundResponse, sendSuccessResponse } from "../util/routes-util";

export const repositoryRoutes = Router();

const eventStore = EventStore.getInstance();
const getAllRepositoriesQueryHandler = new GetAllRepositoriesQueryHandler(
	eventStore,
);
const getRepositoryQueryHandler = new GetRepositoryQueryHandler(eventStore);
const createRepositoryCommandHandler = new CreateRepositoryCommandHandler(
	eventStore,
);
const updateRepositoryCommandHandler = new UpdateRepositoryCommandHandler(
	eventStore,
);
const repositoryController = new RepositoryController(
	getAllRepositoriesQueryHandler,
	getRepositoryQueryHandler,
	createRepositoryCommandHandler,
	updateRepositoryCommandHandler,
);

repositoryRoutes.get(
	"/",
	asyncHandler(async (req, res) => {
		const repositories = await repositoryController.getAllRepositories();

		if (repositories.count === 0) {
			sendNotFoundResponse(res);
			return;
		}

		sendSuccessResponse(res, repositories);
	}),
);

repositoryRoutes.get(
	"/:repositoryId",
	validateRequest({ paramsSchema: getRepositorySchema }),
	asyncHandler(async (req, res) => {
		const repository = await repositoryController.getRepository(
			// biome-ignore lint/style/noNonNullAssertion: We already checked repositoryId with Joi
			new GetRepositoryQuery(req.params.repositoryId!),
		);

		if (repository) {
			sendSuccessResponse(res, repository);
		} else {
			sendNotFoundResponse(res);
		}
	}),
);

repositoryRoutes.post(
	"/",
	jwtMiddleware,
	validateRequest({ bodySchema: createRepositorySchema }),
	asyncHandler(async (req, res) => {
		const { name, description, private: _private } = req.body;
		const userId = req.id;
		const command = new CreateRepositoryCommand(
			generateUuid(),
			name,
			description,
			_private,
			userId!,
		);
		const repository = await repositoryController.createRepository(command);

		sendSuccessResponse(res, repository);
	}),
);

repositoryRoutes.patch(
	"/",
	jwtMiddleware,
	validateRequest({ bodySchema: updateRepositorySchema }),
	asyncHandler(async (req, res) => {
		const authorId = req.id;
		const { name, description, private: _private, id } = req.body;
		await repositoryController.updateRepository({
			name,
			description,
			private: _private,
			// biome-ignore lint/style/noNonNullAssertion: Id should be guaranteed from jwt
			authorId: authorId!,
			id,
		});

		sendSuccessResponse(res, { message: "Repository updated successfully." });
	}),
);
