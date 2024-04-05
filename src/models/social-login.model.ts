import type { UserBasic } from ".";

export interface SocialLogin {
	id: number;
	provider: string;
	provider_id: number;
	user: UserBasic;
	user_id: number;
}
