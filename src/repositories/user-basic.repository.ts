import type { PrismaClient } from "@prisma/client";
import type { UserBasic } from "../models";
import { PrismaRepository } from "./base.repository";

export class UserBasicRepository extends PrismaRepository<UserBasic> {
	constructor(prisma: PrismaClient) {
		super(prisma, "user", [
			"bio",
			"name",
			"public_email",
			"repositories",
			"username",
		]);
	}

	async updatePassword(id: number, password: string): Promise<void> {
		this.prisma.user.update({
			where: { id },
			data: { password },
		});
	}
}
