import type { Repository } from ".";

export interface License {
	id: number;
	name: string;
	key: string;
	repositories: Repository[];
}
