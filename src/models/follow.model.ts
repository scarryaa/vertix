import type { UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface Follow extends BaseEntity {
	id: string;
	follower: UserBasic;
	follower_id: string;
	following: UserBasic;
	following_id: string;
	created_at: Date;
	updated_at: Date;
}
