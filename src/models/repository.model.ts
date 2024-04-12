import type {
	ContributorDetailed,
	Issue,
	License,
	Organization,
	ProgrammingLanguage,
	PullRequest,
	Star,
	Tag,
	UserBasic,
} from ".";
import type { BaseEntity } from "./base.model";

export type TVisibility = "public" | "private" | string;

export interface RepositoryDetailed extends BaseEntity {
	id: string;
	name: string;
	description: string | null;
	visibility: TVisibility;
	created_at: Date;
	updated_at: Date;
	owner: UserBasic;
	ownerId: string;
	issues: Issue[];
	stars: Star[];
	programming_languages: ProgrammingLanguage[];
	primary_language: ProgrammingLanguage | null;
	contributors: ContributorDetailed[];
	license: License | null;
	license_id: string | null;
	tag: Tag | null;
	tag_id: string | null;
	organization: Organization | null;
	organization_id: string | null;
	pull_requests: PullRequest[];
}

export interface RepositoryBasic
	extends Pick<
			RepositoryDetailed,
			| "name"
			| "description"
			| "visibility"
			| "ownerId"
			| "created_at"
			| "updated_at"
			| "id"
		>,
		BaseEntity {}

interface OwnerConnectInput {
	id: string;
}

export interface RepositoryCreator {
	create(data: RepositoryCreateInput): Promise<RepositoryBasic>;
}

export type RepositoryCreateInput = Pick<
	RepositoryDetailed,
	"name" | "visibility" | "owner"
> &
	Partial<
		Pick<RepositoryDetailed, "description" | "license" | "organization">
	> & {
		programming_languages?: ProgrammingLanguage[];
		owner: OwnerConnectInput;
	};

export type RepositoryUpdateInput = Partial<
	Omit<
		RepositoryDetailed,
		"id" | "created_at" | "updated_at" | "owner" | "ownerId"
	>
>;
