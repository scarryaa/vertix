import type { PrismaClient } from "@prisma/client";
import type { Star } from "../models";
import { PrismaRepository } from "./base.repository";

export class StarRepository extends PrismaRepository<Star> {
	constructor(prisma: PrismaClient) {
		super(prisma, "star", ["repositoryId", "userId"]);
	}
}
