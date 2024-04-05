import type { Member, RepositoryDetailed } from ".";

export interface Organization {
	id: number;
	name: string;
	description: string | null;
	created_at: Date;
	updated_at: Date;
	members: Member[];
	repositories: RepositoryDetailed[];
}
