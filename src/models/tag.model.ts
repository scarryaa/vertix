import type { Repository } from ".";

export interface Tag {
	id: number;
	name: string;
	repositories: Repository[];
}
