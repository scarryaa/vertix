import type { PrismaClient } from "@prisma/client";
import type { RepositoryBasic } from "../models";
import { PrismaRepository } from "./base.repository";

export class RepositoryBasicRepository extends PrismaRepository<RepositoryBasic> {
	constructor(prisma: PrismaClient) {
		super(prisma, "repository", ["description", "name"]);
	}
}
