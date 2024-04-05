import type { User } from ".";

export interface Notification {
	id: number;
	userId: number;
	type: string;
	// biome-ignore lint/suspicious/noExplicitAny: data can be any
	data: any;
	read: boolean;
	createdAt: Date;
  }