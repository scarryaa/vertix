import { PrismaClient } from "@prisma/client";
import type { RepositoryBasic, TVisibility } from "../models";
import type { SnapshotManager } from "../services/snapshot-manager/snapshot-manager.service";
import { PrismaRepository } from "./base.repository";

export class RepositoryBasicRepository extends PrismaRepository<RepositoryBasic> {
	constructor(
		prisma: PrismaClient,
		private readonly snapshotManager: SnapshotManager<RepositoryBasic>,
	) {
		super(prisma, "repository", ["description", "name"]);
	}

	create(
		data: Pick<
			RepositoryBasic,
			"name" | "description" | "visibility" | "ownerId"
		>,
		prismaClient?: PrismaClient,
	): Promise<RepositoryBasic> {
		const prisma = prismaClient || new PrismaClient();

		if (data.visibility !== "public" && data.visibility !== "private") {
			throw new Error("Invalid visibility value");
		}

		const assertedData: Pick<
			RepositoryBasic,
			"name" | "description" | "visibility" | "ownerId"
		> = {
			name: data.name,
			description: data.description,
			visibility: data.visibility as TVisibility,
			ownerId: data.ownerId,
		} as Pick<
			RepositoryBasic,
			"name" | "description" | "visibility" | "ownerId"
		>;

		return prisma.repository.create({ data: assertedData });
	}
}
