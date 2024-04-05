import assert from "node:assert";
import fjwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import bcrypt from "bcrypt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { LoginUserInput, UserInput } from "../schemas/user.schema";
import prisma from "../utils/prisma";

const SALT_ROUNDS = Number.parseInt(process.env.SALT_ROUNDS || "10", 10);

export async function createUser(
	req: FastifyRequest<{ Body: UserInput }>,
	reply: FastifyReply,
) {
	try {
		const { password, email, name, username } = req.body;

		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ username }, { email }],
			},
		});

		if (existingUser) {
			return reply
				.status(409)
				.send({ message: "User with this email or username already exists." });
		}

		const hash = await bcrypt.hash(password, SALT_ROUNDS);

		const newUser = await prisma.user.create({
			data: {
				username,
				password: hash,
				email,
				name,
			},
		});

		return reply.status(201).send(newUser);
	} catch (error) {
		throw new Error("INTERNAL_SERVER_ERROR");
	}
}

export async function login(
	req: FastifyRequest<{ Body: LoginUserInput }>,
	reply: FastifyReply,
) {
	try {
		const { email, password } = req.body;

		const user = await prisma.user.findUnique({ where: { email } });

		if (!user || !(await bcrypt.compare(password, user.password))) {
			return reply.status(401).send({ message: "Invalid email or password." });
		}

		const payload = { id: user.id, email: user.email, name: user.name };
		const token = await reply.jwtSign(payload);

		reply.setCookie("access_token", token, {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});

		return reply.send({ message: "Login successful." });
	} catch (error) {
		throw new Error("INTERNAL_SERVER_ERROR");
	}
}

export async function getAllUsers(req: FastifyRequest, reply: FastifyReply) {
	try {
		const users = await prisma.user.findMany({
			select: {
				id: true,
				username: true,
				email: true,
				name: true,
				avatar: true,
				bio: true,
				createdAt: true,
				updatedAt: true,
				publicEmail: true,
				preferences: {
					select: {
						showPublicEmail: true,
					},
				},
			},
		});

		const usersWithEmail = users.map((user) => {
			const { preferences, email, publicEmail, ...rest } = user;
			const showPublicEmail = preferences?.showPublicEmail || false;
			return showPublicEmail ? { ...rest, publicEmail } : rest;
		});

		return reply.status(200).send(usersWithEmail);
	} catch (error) {
		throw new Error("INTERNAL_SERVER_ERROR");
	}
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
	try {
		reply.clearCookie("access_token", {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});

		return reply.send({ message: "Logout successful." });
	} catch (error) {
		throw new Error("INTERNAL_SERVER_ERROR");
	}
}

// biome-ignore lint/suspicious/noExplicitAny: suppress biome error
export default async function userRoutes(fastify: FastifyInstance, _opts: any) {
	fastify.post("/register", createUser);
	fastify.post("/login", login);
	fastify.get("/users", getAllUsers);
	fastify.post("/logout", logout);
}
