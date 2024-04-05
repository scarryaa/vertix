import type { RepositoryDetailed } from ".";

export interface License {
	id: number;
	name: string;
	key: string;
	repositories: RepositoryDetailed[];
}
