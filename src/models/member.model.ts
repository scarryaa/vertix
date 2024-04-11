import type { Organization, OrganizationMemberRole, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface Member extends BaseEntity {
	id: string;
	organization: Organization;
	organization_id: string;
	user: UserBasic;
	user_id: string;
	role: OrganizationMemberRole;
}
