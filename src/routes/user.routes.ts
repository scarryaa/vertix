import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { CustomInstance, UserRoutesOptions } from "../../types/request";
import { createUser, getAllUsers, login, logout } from "../controllers/user.controller";
import errorHandler from "../middlewares/error-handler";
import { $ref } from "../schemas/user.schema";

export const userRoutes: UserRoutesOptions = async function userRoutes(app: CustomInstance) {
	app.get(
		"/",
		{ preHandler: [app.authenticate] },
		(req: FastifyRequest, reply: FastifyReply) => {
			reply.send({ message: "This is the default route for the 'users' endpoint." });
		},
	);

	app.post(
		"/register",
		{
			schema: {
				body: $ref("userSchema"),
				response: {
					201: $ref("userResponseSchema"),
				},
			},
		},
		createUser,
	);

	app.post(
		"/login",
		{
			schema: {
				body: $ref("loginSchema"),
				response: {
					201: $ref("loginResponseSchema"),
				},
			},
		},
		login,
	);

	app.delete("/logout", { preHandler: [app.authenticate] }, logout);

	app.get("/getUsers", { preHandler: [] }, getAllUsers);

	app.log.info("User routes registered.");
}
