import type { Repository, User } from ".";

export interface Star {
	id: number;
	createdAt: Date;
	updatedAt: Date;
	repository: Repository;
	repositoryId: number;
	user: User;
	userId: number;
}
