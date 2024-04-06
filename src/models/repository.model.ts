import type {
	CollaboratorDetailed,
	Issue,
	License,
	Organization,
	ProgrammingLanguage,
	PullRequest,
	Star,
	Tag,
	UserBasic,
} from ".";

export type VisibilityType = "public" | "private";

export interface RepositoryDetailed {
	id: number;
	name: string;
	description: string | null;
	visibility: VisibilityType | string;
	created_at: Date;
	updated_at: Date;
	owner: UserBasic;
	owner_id: number;
	issues: Issue[];
	stars: Star[];
	programming_languages: ProgrammingLanguage[] | null;
	collaborators: CollaboratorDetailed;
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
	Pick<
		RepositoryDetailed,
		| "name"
		| "description"
		| "visibility"
		| "license"
		| "organization"
		| "programming_languages"
	>
>;
