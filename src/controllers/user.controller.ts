import assert from "node:assert";
import bcrypt from "bcrypt";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import type { UserRole } from "../models";
import {
	type CreateUser,
	type GetUsersQuery,
	type LoginUser,
	type UpdateUser,
	createUserSchema,
	getUserQuerySchema,
	getUsersQuerySchema,
	loginUserSchema,
	updateUserSchema,
} from "../schemas/user.schema";
import type { UserService } from "../services/user.service";
import { Session } from "../session/index.session";
import { UnauthorizedError } from "../utils/errors";
import { UserNotFoundError } from "../utils/errors/user.error";
import prisma from "../utils/prisma";

export const createUser =
	(userService: UserService) =>
	async (req: FastifyRequest<{ Body: CreateUser }>, reply: FastifyReply) => {
		const input = createUserSchema.parse(req.body);
		const newUser = await userService.create(input, undefined);

		return reply.status(201).send(newUser);
	};

export const login =
	(userService: UserService) =>
	async (req: FastifyRequest<{ Body: LoginUser }>, reply: FastifyReply) => {
		const { email, password } = loginUserSchema.parse(req.body);

		const user = await prisma.user.findUnique({ where: { email } });

		if (!user || !(await bcrypt.compare(password, user.password))) {
			throw new UnauthorizedError("Invalid email or password.");
		}

		const payload = { userId: user.id, role: user.role };
		assert(process.env.JWT_SECRET, "JWT Secret missing!");
		const token = jwt.sign(payload, process.env.JWT_SECRET);
		// @TODO set these on startup?
		Session.setAuthToken(token);
		Session.setUser({ ...user, role: user.role as UserRole });

		reply.setCookie("access_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/",
			signed: true,
		});

		return reply.send({ message: "Login successful." });
	};

export const getAllUsers =
	(userService: UserService) =>
	async (
		req: FastifyRequest<{ Querystring: GetUsersQuery }>,
		reply: FastifyReply,
	) => {
		const { cursor, take, search, skip } = getUsersQuerySchema.parse(req.query);

		const users = await userService.getAll({
			take,
			cursor: { id: cursor ?? 0 },
			skip,
			search,
		});

		if (users?.length === 0) {
			throw new UserNotFoundError("No users found.");
		}

		const response = {
			users: users?.map((user) => ({
				created_at: user.created_at,
				email: user.email,
				id: user.id,
				name: user.name,
				updated_at: user.updated_at,
				username: user.username,
			})),
			total_count: users?.length,
			cursor: cursor ?? 1,
			take,
		};

		return reply.code(200).send(response);
	};

export const getUser =
	(userService: UserService) =>
	async (
		req: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) => {
		const { id } = getUserQuerySchema.parse(req.params);

		const user = await userService.getById(id);

		if (!user) {
			throw new UserNotFoundError();
		}

		return reply.code(200).send(user);
	};

export const updateUser =
	(userService: UserService) =>
	async (
		req: FastifyRequest<{ Params: { id: string }; Body: UpdateUser }>,
		reply: FastifyReply,
	) => {
		const { id } = req.params;
		const updateData = updateUserSchema.parse(req.body);

		const updatedUser = await userService.update(
			id,
			updateData,
			undefined,
			req.unsignedToken,
		);

		return reply.code(200).send(updatedUser);
	};

export const deleteUser =
	(userService: UserService) =>
	async (
		req: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) => {
		const { id } = req.params;

		await userService.delete(id, undefined, req.unsignedToken);

		return reply.code(204).send();
	};

export const logout =
	(userService: UserService) =>
	async (req: FastifyRequest, reply: FastifyReply) => {
		reply.clearCookie("access_token", {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			signed: true,
		});

		return reply.send({ message: "Logout successful." });
	};
