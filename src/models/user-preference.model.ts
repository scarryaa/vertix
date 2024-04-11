import type { UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface UserPreferences extends BaseEntity {
	id: string;
	user: UserBasic | null;
	user_id: string | null;
	theme: string;
	show_public_email: boolean;
}
