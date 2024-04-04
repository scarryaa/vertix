import assert from "node:assert";
import { env } from "node:process";
import fCookie from "@fastify/cookie";
import fjwt, { type FastifyJWT } from "@fastify/jwt";
import rateLimit from '@fastify/rate-limit'
import fastify, {
	type FastifyInstance,
	type FastifyReply,
	type FastifyRequest,
} from "fastify";
import type { CustomRequest } from "../types/request";
import errorHandler from "./middleware/error-handler";
import { repositoryRoutes } from "./modules/repository/repository.routes";
import { repositorySchemas } from "./modules/repository/repository.schema";
import { userRoutes } from "./modules/user/user.routes";
import { userSchemas } from "./modules/user/user.schema";

type ServerConfig = {
	port: number;
	host: string;
};

class VortexServer {
	private config: ServerConfig;
	app: FastifyInstance;

	constructor(config: ServerConfig) {
		this.config = config;
		this.app = fastify();

		this.setup();
	}

	async setup() {
		this.app.get("/health_check", (req: CustomRequest, res) => {
			res.send({ message: "Success" });
		});

		this.app.register(userRoutes, { prefix: "/api/users" });
		this.app.register(repositoryRoutes, { prefix: "/api/repositories" });

		// add rate limiting, global error handler
		this.app.setErrorHandler(errorHandler);
		this.app.register(rateLimit, {
			max: 100,
			timeWindow: "1 minute",
			keyGenerator: (req) => req.ip
		})

		// add jwt, cookie
		assert(process.env.JWT_SECRET, "JWT_SECRET missing")
		this.app.register(fjwt, {
			secret: process.env.JWT_SECRET ?? "",
			cookie: {
				cookieName: "access_token",
				signed: false,
			},
		});
		this.app.addHook("preHandler", (req, res, next) => {
			req.jwt = this.app.jwt;
			return next();
		});
		this.app.register(fCookie, {
			secret: env.COOKIE_SECRET,
			hook: "preHandler",
		});

		assert(env.JWT_SECRET, "JWT secret not found");
		assert(env.COOKIE_SECRET, "Cookie secret not found");

		this.app.decorate(
			"authenticate",
			async (req: FastifyRequest, reply: FastifyReply) => {
				const token = req.cookies.access_token;

				if (!token) {
					return reply
						.status(401)
						.send({ message: "Authentication required." });
				}
				// @ts-ignore
				const decoded = req.jwt.verify<FastifyJWT["user"]>(token);
				req.user = decoded;
			},
		);

		// add schemas
		for (const schema of userSchemas) {
			this.app.addSchema(schema);
		}

		for (const schema of repositorySchemas) {
			this.app.addSchema(schema);
		}

		const listeners = ["SIGINT", "SIGTERM"];
		for (let i = 0; i < listeners.length; i++) {
			const signal = listeners[i];
			process.on(signal, async () => {
				await this.app.close();
				process.exit(0);
			});
		}
	}

	async start() {
		await this.app.listen({
			port: this.config.port,
			host: this.config.host,
		});

		console.log(`Server listening on port ${this.config.port}`);
	}
}

const server = new VortexServer({ port: 3000, host: "localhost" });
server.start();
