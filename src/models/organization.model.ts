import type { Member, Repository } from ".";

export interface Organization {
	id: number;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	members: Member[];
	repositories: Repository[];
}
