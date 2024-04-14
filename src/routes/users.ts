import express, { Router } from "express";
import { CreateUserCommand } from "../commands/create-user.command";
import { DeleteUserCommand } from "../commands/delete-user.command";
import { CreateUserCommandHandler } from "../commands/handlers/create-user.command.handler";
import { DeleteUserCommandHandler } from "../commands/handlers/delete-user.command.handler";
import { UserController } from "../controllers/user.controller";
import { EventStore } from "../events/store.event";
import { GetAllUsersQueryHandler } from "../queries/handlers/get-all-users.query.handler";
import { GetUserQueryHandler } from "../queries/handlers/get-user.query.handler";
import { generateUuid } from "../util";

export const userRoutes = Router();

const eventStore = new EventStore();
const createUserCommandHandler = new CreateUserCommandHandler(eventStore);
const deleteUserCommandHandler = new DeleteUserCommandHandler(eventStore);
const getAllUsersQueryHandler = new GetAllUsersQueryHandler(eventStore);
const getUserQueryHandler = new GetUserQueryHandler(eventStore);
const userController = new UserController(
	createUserCommandHandler,
	deleteUserCommandHandler,
	getAllUsersQueryHandler,
);

userRoutes.get("/", async (req, res) => {
	// Get all users
	res.json(await getAllUsersQueryHandler.handle());
});

userRoutes.post("/", express.json(), async (req, res) => {
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
		.send({ message: "User created successfully", userId: command.id });
});

userRoutes.get("/:userId", async (req, res) => {
	// Get a single user
	const { userId } = req.params;
	const user = await getUserQueryHandler.handle(userId);

	if (user?.isDeleted() || user === null)
		res.status(404).send({ message: "User not found." });
	else res.json(user);
});

userRoutes.delete("/:userId", async (req, res) => {
	// Delete a single user
	const { userId } = req.params;
	const command = new DeleteUserCommand(userId);

	// Apply the event
	await userController.deleteUser(command);

	res.status(204).send();
});
