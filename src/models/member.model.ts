import type { Organization, OrganizationRole, UserBasic } from ".";

export interface Member {
	id: number;
	organization: Organization;
	organization_id: number;
	user: UserBasic;
	user_id: number;
	role: OrganizationRole;
}
