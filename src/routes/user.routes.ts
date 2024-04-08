import type { FastifyReply, FastifyRequest } from "fastify";
import type {
	AuthenticateInstance,
	UserRoutesOptions,
} from "../../types/request";
import { Container } from "../container";
import {
	createUser,
	deleteUser,
	getAllUsers,
	getUser,
	login,
	logout,
	updateUser,
} from "../controllers/user.controller";
import { validateToken } from "../middlewares/validate-token.middleware";
import { $ref } from "../schemas/user.schema";

const container = Container.getInstance();
const userService = container.getUserService();

export const userRoutes: UserRoutesOptions = async function userRoutes(
	app: AuthenticateInstance,
) {
	app.get("/", (req: FastifyRequest, reply: FastifyReply) => {
		reply.send({
			message: "This is the default route for the 'users' endpoint.",
		});
	});

	app.post(
		"/register",
		{
			schema: {
				body: $ref("createUserSchema"),
				response: {
					201: $ref("userResponseSchema"),
				},
			},
		},
		createUser(userService),
	);

	app.post(
		"/login",
		{
			schema: {
				body: $ref("loginUserSchema"),
				response: {
					201: $ref("loginResponseSchema"),
				},
			},
		},
		login(userService),
	);

	app.post(
		"/delete/:id",
		{
			preHandler: [validateToken, app.authenticate],
			schema: {
				params: $ref("deleteUserParamsSchema"),
				response: {
					204: {
						type: "null",
					},
				},
			},
		},
		deleteUser(userService),
	);

	app.post("/logout", { preHandler: [app.authenticate] }, logout(userService));

	app.get(
		"/getUser/:id",
		{
			schema: {
				response: {
					201: $ref("userResponseSchema"),
				},
			},
		},
		getUser(userService),
	);

	app.patch(
		"/update/:id",
		{
			preHandler: [validateToken, app.authenticate],
			schema: {
				body: $ref("updateUserSchema"),
				params: $ref("updateUserParamsSchema"),
				response: {
					201: $ref("userResponseSchema"),
				},
			},
		},
		updateUser(userService),
	);

	app.get("/getUsers", { preHandler: [] }, getAllUsers(userService));

	app.log.info("User routes registered.");
};
