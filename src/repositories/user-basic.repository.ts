import type { PrismaClient } from "@prisma/client";
import type { UserBasic } from "../models";
import { PrismaRepository } from "./base.repository";

export class UserBasicRepository extends PrismaRepository<UserBasic> {
	constructor(prisma: PrismaClient) {
		super(prisma, "user");
	}
}
