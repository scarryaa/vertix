import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { CustomInstance, UserRoutesOptions } from "../../../types/request";
import { createUser, getUsers, login, logout } from "./user.controller";
import { $ref } from "./user.schema";

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

	app.get("/getUsers", { preHandler: [app.authenticate] }, getUsers);

	app.log.info("User routes registered.");
}