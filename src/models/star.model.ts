import type { Repository, User } from ".";

export interface Star {
	id: number;
	createdAt: Date;
	updatedAt: Date;
	repositoryId: number;
	userId: number;
	repository: Repository;
	user: User;
}
