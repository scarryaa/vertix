import assert from "node:assert";
import { env } from "node:process";
import fCookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import rateLimit from "@fastify/rate-limit";
import * as dotenv from "dotenv";
import fastify, {
	type FastifyInstance,
	type FastifyReply,
	type FastifyRequest,
} from "fastify";
import jwt from "jsonwebtoken";
import type { CustomRequest } from "../types/request";
import { errorHandler } from "./middlewares/error.middleware";
import { repositoryRoutes } from "./routes/repository.routes";
import { starRoutes } from "./routes/star.routes";
import { userRoutes } from "./routes/user.routes";
import { repositorySchemas } from "./schemas/repository.schema";
import { starSchemas } from "./schemas/star.schema";
import { userSchemas } from "./schemas/user.schema";
import type { JwtPayload } from "./utils/types";

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
		this.app.register(formbody);

		this.app.get("/health_check", (req: CustomRequest, res) => {
			res.send({ message: "Success" });
		});

		this.app.register(userRoutes, { prefix: "/api/users" });
		this.app.register(repositoryRoutes, { prefix: "/api/repositories" });
		this.app.register(starRoutes, { prefix: "/api/stars" });

		// add rate limiting, global error handler
		this.app.setErrorHandler(errorHandler);
		this.app.register(rateLimit, {
			max: 100,
			timeWindow: "1 minute",
			keyGenerator: (req) => req.ip,
		});

		// add cookie
		assert(env.COOKIE_SECRET, "Cookie secret not found");

		this.app.register(fCookie, {
			secret: env.COOKIE_SECRET,
			hook: "preHandler",
		});

		this.app.decorate(
			"authenticate",
			async (req: FastifyRequest, reply: FastifyReply) => {
				const token = req.unsignCookie(req.cookies.access_token ?? "").value;
				if (!token) {
					return reply
						.status(401)
						.send({ message: "Authentication required." });
				}

				if (!process.env.JWT_SECRET) {
					throw new Error("JWT secret not found");
				}

				const decoded = jwt.verify(
					token,
					process.env.JWT_SECRET,
				) as unknown as JwtPayload;
				req.user = {
					user_id: decoded.user_id,
					role: decoded.role,
				};
			},
		);

		// add schemas
		for (const schema of userSchemas) {
			this.app.addSchema(schema);
		}

		for (const schema of repositorySchemas) {
			this.app.addSchema(schema);
		}

		for (const schema of starSchemas) {
			this.app.addSchema(schema);
		}

		const listeners = ["SIGINT", "SIGTERM"];
		for (let i = 0; i < listeners.length; i++) {
			const signal = listeners[i] ?? "";
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
