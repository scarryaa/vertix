import type { Collaborator } from "@prisma/client";
import type { CollaboratorRepository } from "../repositories/collaborator.repository";

export class CollaboratorService {
	constructor(private collabRepo: CollaboratorRepository) {}

	async findCollaborator(
		repositoryId: number,
		userId: number,
	): Promise<Collaborator | null> {
		return await this.collabRepo.findOne(repositoryId, userId);
	}
}
