import type { User } from ".";

export interface Follow {
	id: number;
	follower: User;
	followerId: number;
	following: User;
	followingId: number;
	createdAt: Date;
	updatedAt: Date;
}
