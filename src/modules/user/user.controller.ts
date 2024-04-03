import { JWT } from "@fastify/jwt";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { LoginUserInput, UserInput } from "./user.schema";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function createUser(
	req: FastifyRequest<{
		Body: UserInput;
	}>,
	reply: FastifyReply,
) {
	const { password, email, name, username } = req.body;

	const user = await prisma.user.findUnique({
		where: {
			email: email,
		},
	});

	if (user) {
		return reply.code(401).send({
			message: "User with this email aready exists.",
		});
	}

	try {
		const hash = await bcrypt.hash(password, SALT_ROUNDS);
		const user = await prisma.user.create({
			data: {
				username,
				password: hash,
				email,
				name,
			},
		});

		return reply.code(201).send(user);
	} catch (error) {
		return reply.code(500).send(error);
	}
}

export async function login(
	req: FastifyRequest<{
		Body: LoginUserInput;
	}>,
	reply: FastifyReply,
) {
	const { email, password } = req.body;
	const user = await prisma.user.findUnique({ where: { email: email } });

	const isMatch = user && (await bcrypt.compare(password, user.password));
	if (!user || !isMatch) {
		return reply.code(401).send({
			message: "Invalid email or password.",
		});
	}

	const payload = {
		id: user.id,
		email: user.email,
		name: user.name,
	};

	// @ts-ignore ignore typescript complaints
	const token = req.jwt.sign(payload);

	reply.setCookie("access_token", token, {
		path: "/",
		httpOnly: true,
		secure: true,
	});

	return { accessToken: token };
}

export async function getUsers(req: FastifyRequest, reply: FastifyReply) {
	const users = await prisma.user.findMany({
		select: {
			name: true,
			id: true,
			email: true,
		},
	});

	return reply.code(200).send(users);
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
	reply.clearCookie("access_token");

	return reply.send({ message: "Logout successful." });
}
