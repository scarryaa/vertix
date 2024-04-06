import assert from "node:assert";
import bcrypt from "bcrypt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
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

		const payload = { id: user.id, role: user.role };
		assert(process.env.JWT_SECRET, "JWT Secret missing!");
		const token = jwt.sign(payload, process.env.JWT_SECRET);

		reply.setCookie("access_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/",
			signed: true,
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
				created_at: true,
				updated_at: true,
				public_email: true,
			},
		});

		// const usersWithEmail = users.map((user) => {
		// 	const { email, public_email, ...rest } = user;
		// 	const showPublicEmail = preferences?.showPublicEmail || false;
		// 	return showPublicEmail ? { ...rest, publicEmail } : rest;
		// });

		return reply.status(200).send([]);
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
			signed: true,
		});

		return reply.send({ message: "Logout successful." });
	} catch (error) {
		throw new Error("INTERNAL_SERVER_ERROR");
	}
}

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.post("/register", createUser);
	fastify.post("/login", login);
	fastify.get("/users", getAllUsers);
	fastify.post("/logout", logout);
}
