import jwt from "jsonwebtoken";
import { CreateUserCommand } from "../commands/user/create-user.command";
import { DeleteUserCommand } from "../commands/user/delete-user.command";
import { Config } from "../config";
import { UserController } from "../controllers/user.controller";
import { EventStore } from "../events/store.event";
import { validateUserCredentials } from "../jwt";
import { type JwtPayload, jwtMiddleware, revokeToken } from "../middleware/jwt";
import { validateRequest } from "../middleware/validation";
import { GetUserQuery } from "../queries/user/get-user.query";
import {
	createUserSchema,
	deleteUserSchema,
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

import { type Request, type Response, Router } from "express";
import { CreateUserCommandHandler } from "../commands/user/handlers/create-user.command.handler";
import { DeleteUserCommandHandler } from "../commands/user/handlers/delete-user.command.handler";
import { UpdateUserCommandHandler } from "../commands/user/handlers/update-user.command.handler";
import { GetAllUsersQueryHandler } from "../queries/user/handlers/get-all-users.query.handler";
import { GetUserQueryHandler } from "../queries/user/handlers/get-user.query.handler";
import { MailService } from "../services/mail.service";
import { UserService } from "../services/user.service";

class UserRoutes {
	private router: Router;
	private userController: UserController;
	private eventStore: EventStore;
	private userService: UserService;
	private emailService: MailService;

	constructor(
		userController: UserController,
		eventStore: EventStore,
		userService: UserService,
		emailService: MailService,
	) {
		this.router = Router();
		this.userController = userController;
		this.eventStore = eventStore;
		this.userService = userService;
		this.emailService = emailService;

		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get("/", this.getAllUsers.bind(this));
		this.router.get(
			"/:userId",
			validateRequest({ paramsSchema: getUserSchema }),
			this.getUser.bind(this),
		);
		this.router.patch(
			"/",
			validateRequest({ bodySchema: updateUserSchema }),
			jwtMiddleware,
			this.updateUser.bind(this),
		);
		this.router.post(
			"/login",
			validateRequest({ bodySchema: loginUserSchema }),
			this.loginUser.bind(this),
		);
		this.router.post("/logout", this.logoutUser.bind(this));
		this.router.post(
			"/",
			validateRequest({ bodySchema: createUserSchema }),
			this.createUser.bind(this),
		);
		this.router.post(
			"/request-delete",
			jwtMiddleware,
			this.requestDeleteUser.bind(this),
		);
		this.router.get(
			"/confirm-delete/:deletionToken",
			jwtMiddleware,
			validateRequest({ paramsSchema: deleteUserSchema }),
			this.confirmDeleteUser.bind(this),
		);
		this.router.delete("/", jwtMiddleware, this.deleteUser.bind(this));
	}

	private async getAllUsers(req: Request, res: Response) {
		const users = await this.userController.getAllUsers();
		sendSuccessResponse(res, users);
	}

	private async getUser(req: Request, res: Response) {
		const { userId } = req.params;
		// biome-ignore lint/style/noNonNullAssertion: We already checkeed with Joi
		const query = new GetUserQuery(userId!);
		const user = await this.userController.getUser(query);

		if (user === null || Object.keys(user).length === 0) {
			sendNotFoundResponse(res);
		} else {
			sendSuccessResponse(res, user);
		}
	}

	private async updateUser(req: Request, res: Response) {
		const { userId, username, email, password, name } = req.body;
		await this.userController.updateUser({
			username,
			email,
			password,
			name,
			id: userId,
		});
		sendSuccessResponse(res, { message: "User updated successfully." });
	}

	private async loginUser(req: Request, res: Response) {
		const { username, password } = req.body;
		const user = await validateUserCredentials(this.eventStore)(
			username,
			password,
		);

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
	}

	private async logoutUser(req: Request, res: Response) {
		const token = req.cookies.token;
		if (token) {
			const decoded = jwt.verify(token, Config.jwtSecret) as JwtPayload;
			await revokeToken(decoded.jti);
			res.clearCookie("token");
		}
		return sendNoContentResponse(res);
	}

	private async createUser(req: Request, res: Response) {
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
		await this.userController.createUser(command);
		sendCreatedResponse(
			res,
			{ message: "User created successfully.", id: command.id },
			`/users/${command.id}`,
		);
	}

	private async requestDeleteUser(req: Request, res: Response) {
		if (req.id) {
			const deletionToken = generateUuid();
			// Reconstruct the user aggregate
			const user = await this.userService.reconstructUserAggregateFromEvents(
				req.id,
			);

			// Store the deletion token
			user.setDeletionToken(deletionToken);

			// Send a response and email
			this.emailService.sendEmail({
				subject: "Account deletion request",
				to: "scarryaa@gmail.com",
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
	}

	private async confirmDeleteUser(req: Request, res: Response) {
		const { deletionToken } = req.params;
		const userId = req.id;

		const user = await this.userService.reconstructUserAggregateFromEvents(
			// biome-ignore lint/style/noNonNullAssertion: We already checkeed with Joi
			userId!,
		);

		// biome-ignore lint/style/noNonNullAssertion: We already validated the deletion token with Joi
		if (user.validateDeletionToken(deletionToken!)) {
			// Proceed with account deletion logic
			// deleteUserByDeletionToken(deletionToken);
			sendNoContentResponse(res);
		} else {
			sendUnauthorizedResponse(res);
		}
	}

	private async deleteUser(req: Request, res: Response) {
		// Get user id from request
		if (req.id) {
			const command = new DeleteUserCommand(req.id);

			// Apply the event
			await this.userController.deleteUser(command);

			// Remove cookie
			res.clearCookie("token");

			sendNoContentResponse(res);
		} else {
			sendUnauthorizedResponse(res);
		}
	}

	public getRouter(): Router {
		return this.router;
	}
}

const userRoutes = new UserRoutes(
	new UserController(
		new CreateUserCommandHandler(EventStore.getInstance()),
		new DeleteUserCommandHandler(EventStore.getInstance()),
		new GetAllUsersQueryHandler(EventStore.getInstance()),
		new GetUserQueryHandler(EventStore.getInstance()),
		new UpdateUserCommandHandler(EventStore.getInstance()),
	),
	EventStore.getInstance(),
	UserService.getInstance(),
	new MailService(),
).getRouter();

export { userRoutes };
