import assert from "node:assert";
import { env } from "node:process";
import fCookie from "@fastify/cookie";
import fjwt, { type FastifyJWT } from "@fastify/jwt";
import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { userRoutes } from "./modules/user/user.route";
import { userSchemas } from "./modules/user/user.schema";

const app = fastify();

async function main() {
	app.get("/health_check", (req, res) => {
		res.send({ message: "Success" });
	});

	app.register(userRoutes, { prefix: "/api/users" });

	// add jwt, cookie
	app.register(fjwt, { secret: env.JWT_SECRET ?? "" });
	app.addHook("preHandler", (req, res, next) => {
		req.jwt = app.jwt;
		return next();
	});
	app.register(fCookie, {
		secret: env.COOKIE_SECRET,
		hook: "preHandler",
	});

	assert(env.JWT_SECRET, "JWT secret not found");
	assert(env.COOKIE_SECRET, "Cookie secret not found");

	app.decorate(
		"authenticate",
		async (req: FastifyRequest, reply: FastifyReply) => {
			const token = req.cookies.access_token;

			if (!token) {
				return reply.status(401).send({ message: "Authentication required." });
			}
			// @ts-ignore
			const decoded = req.jwt.verify<FastifyJWT["user"]>(token);
			req.user = decoded;
		},
	);

	// add schemas
	for (const schema of userSchemas) {
		app.addSchema(schema);
	}

	await app.listen({
		port: 3000,
		host: "localhost",
	});

	const listeners = ["SIGINT", "SIGTERM"];
	for (let i = 0; i < listeners.length; i++) {
		const signal = listeners[i];
		process.on(signal, async () => {
			await app.close();
			process.exit(0);
		});
	}

	console.log(`Server listening on port ${3000}`);
}

main();
