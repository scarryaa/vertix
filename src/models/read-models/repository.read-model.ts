import type { TVisibility } from "..";
import type { BaseEntity } from "../base.model";
import type { UserReadModel } from "./user.read-model";

export interface RepositoryDashboardReadModel extends BaseEntity {
	id: string;
	name: string;
	description: string | null;
	visibility: TVisibility;
	starCount: number;
	primaryLanguage: string | null;
	ownerId: string;
	owner?:
		| UserReadModel
		| {
				connect: {
					id: string;
				};
		  };
}
