import type { User } from ".";

export interface UserPreference {
	id: number;
	user: User | null;
	userId: number;
	theme: string;
	showPublicEmail: boolean;
}
