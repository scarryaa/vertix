import type { UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface SocialLogin extends BaseEntity {
	id: string;
	provider: string;
	provider_id: string;
	user: UserBasic;
	user_id: string;
}
