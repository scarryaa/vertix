export type VisibilityType = "public" | "private";

export interface Repository {
	id: number;
	name: string;
	description: string | null;
	visibility: VisibilityType | string;
	createdAt: Date;
	updatedAt: Date;
	ownerId: number;
	language: string | null;
	licenseId: number | null;
	tagId: number | null;
	organizationId: number | null;
}
