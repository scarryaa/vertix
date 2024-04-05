import type { Organization, User } from ".";

export interface Member {
	id: number;
	organizationId: number;
	userId: number;
	role: string;
}
