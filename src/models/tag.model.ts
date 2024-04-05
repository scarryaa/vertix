import type { RepositoryDetailed } from ".";

export interface Tag {
	id: number;
	name: string;
	repositories: RepositoryDetailed[];
}
