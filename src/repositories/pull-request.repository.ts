import type { PrismaClient } from "@prisma/client";
import type { PullRequest } from "../models";
import { PrismaRepository } from "./base.repository";

export class PullRequestRepository extends PrismaRepository<PullRequest> {
	constructor(prisma: PrismaClient) {
		super(prisma, "pull_request", [
			"id",
			"title",
			"description",
			"status",
			"created_at",
			"updated_at",
			"repository",
		]);
	}
}
