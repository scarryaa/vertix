import type { UserBasic } from ".";

export interface UserPreferences {
	id: number;
	user: UserBasic | null;
	user_id: number | null;
	theme: string;
	show_public_email: boolean;
}
