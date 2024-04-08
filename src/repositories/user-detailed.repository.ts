import type { PrismaClient } from "@prisma/client";
import type { UserDetailed } from "../models";
import { PrismaRepository } from "./base.repository";

export class UserDetailedRepository extends PrismaRepository<UserDetailed> {
	constructor(prisma: PrismaClient) {
		super(prisma, "user", [
			"bio",
			"name",
			"public_email",
			"location",
			"preferred_languages",
			"username",
			"programming_languages",
		]);
	}
}
