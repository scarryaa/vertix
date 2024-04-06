import type { PrismaClient } from "@prisma/client";
import type { RepositoryDetailed } from "../models";
import { PrismaRepository } from "./base.repository";

export class RepositoryDetailedRepository extends PrismaRepository<RepositoryDetailed> {
	constructor(prisma: PrismaClient) {
		super(prisma, "repository");
	}
}
