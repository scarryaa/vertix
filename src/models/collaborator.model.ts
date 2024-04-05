import type { Repository, User } from ".";

export interface Collaborator {
	id: number;
	repository: Repository;
	repositoryId: number;
	user: User;
	userId: number;
}
