import { PrismaClient } from "@prisma/client";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createUser, getUsers, login, logout } from "./user.controller";
import { $ref } from "./user.schema";

const prisma = new PrismaClient();

export async function userRoutes(app: FastifyInstance) {
	app.get(
		"/",
		// @ts-ignore ignore typescript complaints
		{ preHandler: [app.authenticate] },
		(req: FastifyRequest, reply: FastifyReply) => {
			reply.send({ message: "/ route hit" });
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

	// @ts-ignore ignore typescript complaints
	app.delete("/logout", { preHandler: [app.authenticate] }, logout);

	// @ts-ignore ignore typescript complaints
	app.get("/getUsers", { preHandler: [app.authenticate] }, getUsers);

	app.log.info("User routes registered.");
}
