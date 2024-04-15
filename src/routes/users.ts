import express, { Router } from "express";
import { CreateUserCommand } from "../commands/create-user.command";
import { DeleteUserCommand } from "../commands/delete-user.command";
import { CreateUserCommandHandler } from "../commands/handlers/create-user.command.handler";
import { DeleteUserCommandHandler } from "../commands/handlers/delete-user.command.handler";
import { UpdateUserCommandHandler } from "../commands/handlers/update-user.command.handler";
import { UserController } from "../controllers/user.controller";
import { EventStore } from "../events/store.event";
import { asyncHandler } from "../middleware/async-handler";
import { errorHandler } from "../middleware/errors";
import { validateRequest } from "../middleware/validation";
import { GetUserQuery } from "../queries/get-user.query";
import { GetAllUsersQueryHandler } from "../queries/handlers/get-all-users.query.handler";
import { GetUserQueryHandler } from "../queries/handlers/get-user.query.handler";
import {
	createUserSchema,
	deleteUserSchema,
	getAllUsersSchema,
	getUserSchema,
	updateUserSchema,
} from "../schemas/user.schema";
import { generateUuid } from "../util";

export const userRoutes = Router();

const eventStore = new EventStore();
const createUserCommandHandler = new CreateUserCommandHandler(eventStore);
const deleteUserCommandHandler = new DeleteUserCommandHandler(eventStore);
const updateUserCommandHandler = new UpdateUserCommandHandler(eventStore);
const getAllUsersQueryHandler = new GetAllUsersQueryHandler(eventStore);
const getUserQueryHandler = new GetUserQueryHandler(eventStore);
const userController = new UserController(
	createUserCommandHandler,
	deleteUserCommandHandler,
	getAllUsersQueryHandler,
	getUserQueryHandler,
	updateUserCommandHandler,
);

userRoutes.use(express.json());

userRoutes.get(
	"/",
	validateRequest({ querySchema: getAllUsersSchema }),
	asyncHandler(async (req, res) => {
		// Get all users
		const users = await userController.getAllUsers();

		res.send(users);
	}),
);

userRoutes.patch(
	"/",
	validateRequest({ bodySchema: updateUserSchema }),
	asyncHandler(async (req, res) => {
		// Update user
		const { userId, username, email, password, name } = req.body;
		await userController.updateUser({
			username,
			email,
			password,
			name,
			id: userId,
		});

		res.send({ message: "User updated successfully" });
	}),
);

userRoutes.post(
	"/",
	validateRequest({ bodySchema: createUserSchema }),
	asyncHandler(async (req, res) => {
		// Create a new user
		const { username, password, email, name } = req.body;
		const command = new CreateUserCommand(
			generateUuid(),
			username,
			password,
			email,
			name,
		);

		// Apply the event
		await userController.createUser(command);

		res
			.status(201)
			.location(`/users/${command.id}`)
			.send({ message: "User created successfully", userId: command.id });
	}),
);

userRoutes.get(
	"/:userId",
	validateRequest({ paramsSchema: getUserSchema }),
	asyncHandler(async (req, res) => {
		// Get a single user
		const { userId } = req.params;
		// biome-ignore lint/style/noNonNullAssertion: We already checked with Joi
		const query = new GetUserQuery(userId!);
		const user = await getUserQueryHandler.handle(query);

		if (user?.isDeleted() || user === null) {
			res.status(404).send({ message: "User not found." });
		} else {
			res.send(user);
		}
	}),
);

userRoutes.delete(
	"/:userId",
	validateRequest({ paramsSchema: deleteUserSchema }),
	asyncHandler(async (req, res) => {
		// Delete a single user
		const { userId } = req.params;
		// biome-ignore lint/style/noNonNullAssertion: We already checked with Joi
		const command = new DeleteUserCommand(userId!);

		// Apply the event
		await userController.deleteUser(command);

		res.status(204).send();
	}),
);

userRoutes.use(errorHandler);
