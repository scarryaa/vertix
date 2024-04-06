import fastify, {
	type FastifyInstance,
	type FastifyReply,
	type FastifyRequest,
} from "fastify";

const app = fastify();
let server: FastifyInstance;

beforeAll(async () => {
	await app.register(import("@fastify/rate-limit"), {
		max: 5,
		timeWindow: "1 minute",
	});

	app.get(
		"/health_check",
		async (request: FastifyRequest, reply: FastifyReply) => {
			return { status: "OK" };
		},
	);

	server = app;
	await server.listen({ port: 9000 });
});

afterAll(async () => {
	await server.close();
});

describe("Rate Limiting", () => {
	test("should limit requests after exceeding the rate limit", async () => {
		const baseUrl = `http://localhost:${9000}`;
		const fetch = await import("node-fetch");

		for (let i = 0; i < 6; i++) {
			const response = await fetch.default(`${baseUrl}/health_check`, {
				method: "GET",
			});

			if (i < 5) {
				expect(response.status).toBe(200);
			} else {
				expect(response.status).toBe(429); // Too Many Requests
			}
		}
	});
});
