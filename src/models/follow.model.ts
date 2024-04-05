import type { UserBasic } from ".";

export interface Follow {
	id: number;
	follower: UserBasic;
	follower_id: number;
	following: UserBasic;
	following_id: number;
	created_at: Date;
	updated_at: Date;
}
