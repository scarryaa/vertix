import { Router } from "express";
import jwt from "jsonwebtoken";
import { Vertix } from "..";
import { CreateUserCommand } from "../commands/user/create-user.command";
import { DeleteUserCommand } from "../commands/user/delete-user.command";
import { CreateUserCommandHandler } from "../commands/user/handlers/create-user.command.handler";
import { DeleteUserCommandHandler } from "../commands/user/handlers/delete-user.command.handler";
import { UpdateUserCommandHandler } from "../commands/user/handlers/update-user.command.handler";
import { Config } from "../config";
import { UserController } from "../controllers/user.controller";
import { EventStore } from "../events/store.event";
import { validateUserCredentials } from "../jwt";
import { asyncHandler } from "../middleware/async-handler";
import { type JwtPayload, jwtMiddleware, revokeToken } from "../middleware/jwt";
import { validateRequest } from "../middleware/validation";
import { GetUserQuery } from "../queries/user/get-user.query";
import { GetAllUsersQueryHandler } from "../queries/user/handlers/get-all-users.query.handler";
import { GetUserQueryHandler } from "../queries/user/handlers/get-user.query.handler";
import {
	createUserSchema,
	deleteUserSchema,
	getAllUsersSchema,
	getUserSchema,
	loginUserSchema,
	updateUserSchema,
} from "../schemas/user.schema";
import { generateUuid } from "../util";
import {
	sendCreatedResponse,
	sendNoContentResponse,
	sendNotFoundResponse,
	sendSuccessResponse,
	sendUnauthorizedResponse,
} from "../util/routes-util";

export const userRoutes = Router();

const eventStore = EventStore.getInstance();
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

userRoutes.get(
	"/",
	validateRequest({ querySchema: getAllUsersSchema }),
	asyncHandler(async (req, res) => {
		// Get all users
		const users = await userController.getAllUsers();

		sendSuccessResponse(res, users);
	}),
);

userRoutes.get(
	"/:userId",
	validateRequest({ paramsSchema: getUserSchema }),
	asyncHandler(async (req, res) => {
		// Get a single user
		const { userId } = req.params;
		// biome-ignore lint/style/noNonNullAssertion: We already checked userId with Joi
		const query = new GetUserQuery(userId!);
		const user = await userController.getUser(query);

		// Check if user is null or all properties are null
		if (user === null || Object.keys(user).length === 0) {
			sendNotFoundResponse(res);
		} else {
			sendSuccessResponse(res, user);
		}
	}),
);

userRoutes.patch(
	"/",
	validateRequest({ bodySchema: updateUserSchema }),
	jwtMiddleware,
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

		sendSuccessResponse(res, { message: "User updated successfully." });
	}),
);

userRoutes.post(
	"/login",
	validateRequest({ bodySchema: loginUserSchema }),
	asyncHandler(async (req, res) => {
		const { username, password } = req.body;
		const user = await validateUserCredentials(eventStore)(username, password);

		if (!user) {
			sendUnauthorizedResponse(res);
			return;
		}

		// Generate JWT
		const token = jwt.sign(
			{
				id: user.id,
				username: user.username,
				iat: Math.floor(Date.now() / 1000),
				nbf: Math.floor(Date.now() / 1000),
				jti: generateUuid(),
			},
			Config.jwtSecret,
			{ expiresIn: "1h" },
		);

		res.cookie("token", token, {
			httpOnly: true,
			secure: Config.nodeEnv === "production",
			maxAge: 3600000, // 1 hour
			sameSite: "strict",
		});
		sendSuccessResponse(res, { message: "Login successful." });
	}),
);

userRoutes.post(
	"/logout",
	asyncHandler(async (req, res) => {
		const token = req.cookies.token;
		if (token) {
			const decoded = jwt.verify(token, Config.jwtSecret) as JwtPayload;
			await revokeToken(decoded.jti);
			res.clearCookie("token");
		}
		return sendNoContentResponse(res);
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
		sendCreatedResponse(
			res,
			{ message: "User created successfully.", id: command.id },
			`/users/${command.id}`,
		);
	}),
);

userRoutes.post(
	"/request-delete",
	jwtMiddleware,
	asyncHandler(async (req, res) => {
		if (req.id) {
			const deletionToken = generateUuid();
			// Reconstruct the user aggregate
			const user = await Vertix.getInstance()
				.getUserService()
				.reconstructUserAggregateFromEvents(req.id);

			// Store the deletion token
			user.setDeletionToken(deletionToken);

			// Send a response and email
			Vertix.getInstance().getEmailService().sendEmail({
				subject: "Account deletion request",
				to: "CHANGE_THIS@gmail.com",
                text: "Hi",
				html: "<h1>Hi</h1>",
            });
			
			sendSuccessResponse(res, {
				message:
					"Confirmation email sent. Please check your email to confirm account deletion.",
			});
		} else {
			sendUnauthorizedResponse(res);
		}
	}),
);

userRoutes.get(
	"/confirm-delete/:deletionToken",
	jwtMiddleware,
	validateRequest({ paramsSchema: deleteUserSchema }),
	asyncHandler(async (req, res) => {
		const { deletionToken } = req.params;
		const userId = req.id;

		const user = await Vertix.getInstance()
			.getUserService()
			// biome-ignore lint/style/noNonNullAssertion: userId should be there from jwt middleware
			.reconstructUserAggregateFromEvents(userId!);

		// biome-ignore lint/style/noNonNullAssertion: We already validated the deletion token with Joi
		if (user.validateDeletionToken(deletionToken!)) {
			// Proceed with account deletion logic
			// deleteUserByDeletionToken(deletionToken);
			sendNoContentResponse(res);
		} else {
			sendUnauthorizedResponse(res);
		}
	}),
);

userRoutes.delete(
	"/",
	jwtMiddleware,
	asyncHandler(async (req, res) => {
		// Get user id from request
		if (req.id) {
			const command = new DeleteUserCommand(req.id);

			// Apply the event
			await userController.deleteUser(command);

			// Remove cookie
			res.clearCookie("token");

			sendNoContentResponse(res);
		} else {
			sendUnauthorizedResponse(res);
		}
	}),
);
