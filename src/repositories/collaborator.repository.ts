import type { Collaborator, PrismaClient } from "@prisma/client";

export class CollaboratorRepository {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async findById(id: number): Promise<Collaborator | null> {
		const collaborator = await this.prisma.collaborator.findUnique({
			where: {
				id,
			},
		});

		return collaborator;
	}

	async findOne(
		repositoryId: number,
		userId: number,
	): Promise<Collaborator | null> {
		const collaborator = await this.prisma.collaborator.findUnique({
			where: {
				repository_id_user_id: {
					repository_id: repositoryId,
					user_id: userId,
				},
			},
		});

		return collaborator;
	}
}
