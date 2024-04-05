import type { User } from ".";

export interface Notification {
	id: number;
	user: User;
	userId: number;
	type: string;
	// biome-ignore lint/suspicious/noExplicitAny: data can be anything
	data: any;
	read: boolean;
	createdAt: Date;
}
