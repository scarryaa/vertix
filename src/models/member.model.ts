import type { Organization, User } from ".";

export interface Member {
	id: number;
	organization: Organization;
	organizationId: number;
	user: User;
	userId: number;
	role: string;
}
