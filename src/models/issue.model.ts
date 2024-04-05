export interface Issue {
	id: number;
	title: string;
	body: string | null;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	repositoryId: number;
	authorId: number;
}
