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

export type TVisibility = "public" | "private";

export interface RepositoryIdentifier {
	id?: number;
	name?: string;
}

export interface RepositoryDetailed {
	id: number;
	name: string;
	description: string | null;
	visibility: TVisibility | string;
	created_at: Date;
	updated_at: Date;
	owner: UserBasic;
	owner_id: number;
	issues: Issue[];
	stars: Star[];
	programming_languages: ProgrammingLanguage[] | null;
	contributors: ContributorDetailed[];
	license: License | null;
	license_id: number | null;
	tag: Tag | null;
	tag_id: number | null;
	organization: Organization | null;
	organization_id: number | null;
	pull_requests: PullRequest[];
}

export interface RepositoryBasic
	extends Pick<
		RepositoryDetailed,
		| "name"
		| "description"
		| "visibility"
		| "owner_id"
		| "created_at"
		| "updated_at"
		| "id"
	> {}

interface OwnerConnectInput {
	id: number;
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
		"id" | "created_at" | "updated_at" | "owner" | "owner_id"
	>
>;
