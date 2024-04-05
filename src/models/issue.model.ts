import type { Comment, Repository, User } from "./index";

export interface Issue {
	id: number;
	title: string;
	body: string | null;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	repository: Repository;
	repositoryId: number;
	author: User;
	authorId: number;
	Comment: Comment[];
}
