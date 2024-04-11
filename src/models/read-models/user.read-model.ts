import type { Language, ProgrammingLanguage, Timezone, UserStatus } from "..";
import type { BaseEntity } from "../base.model";

export interface UserReadModel extends BaseEntity {
	id: string;
	username: string;
	name: string;
	avatar: string | null;
	bio: string | null;
	public_email: string | null;
	verified_email: boolean;
	languages: Language[];
	preferred_languages: Language[];
	programming_languages: ProgrammingLanguage[];
	timezone: Timezone;
	status: UserStatus;
	location: string | null;
	website: string | null;
	followersCount: number;
	followingCount: number;
	repositoryCount: number;
}
