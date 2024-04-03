import { JWT } from "@fastify/jwt";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { LoginUserInput, UserInput } from "./user.schema";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function createUser(req: FastifyRequest<{ Body: UserInput }>, reply: FastifyReply) {
    try {
        const { password, email, name, username } = req.body;

        // Check if user with the provided email or username already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        // If user already exists, return error response
        if (existingUser) {
            return reply.code(409).send({ message: "User with this email or username already exists." });
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

        return reply.code(201).send(newUser);
    } catch (error) {
        console.error("Error creating user:", error);
        return reply.code(500).send({ message: "Internal Server Error" });
    }
}

export async function login(req: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply) {
    try {
        // Retrieve email and password from request body
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        // If user doesn't exist or password is incorrect, return error response
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return reply.code(401).send({ message: "Invalid email or password." });
        }
        const payload = { id: user.id, email: user.email, name: user.name };
		// @ts-ignore ignore ts error
        const token = req.jwt.sign(payload);

        reply.setCookie("access_token", token, { path: "/", httpOnly: true, secure: true });

        return reply.send({ message: "Login successful." });
    } catch (error) {
        console.error("Error logging in:", error);
        return reply.code(500).send({ message: "Internal Server Error" });
    }
}

export async function getUsers(req: FastifyRequest, reply: FastifyReply) {
    try {
        const users = await prisma.user.findMany({
            select: { name: true, id: true, email: true },
        });
        return reply.code(200).send(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return reply.code(500).send({ message: "Internal Server Error" });
    }
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
    try {
        // Clear access token cookie
        reply.clearCookie("access_token");
        return reply.send({ message: "Logout successful." });
    } catch (error) {
        console.error("Error logging out:", error);
        return reply.code(500).send({ message: "Internal Server Error" });
    }
}
