import type { User } from "@prisma/client";
import prisma from "../utils/prisma";

export class UserRepository {
	async findById(userId: number): Promise<User | null> {
		return prisma.user.findFirst({ where: { id: userId } });
	}
}
