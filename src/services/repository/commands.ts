import type { Repository } from "./types";

export class DeleteRepositoryCommand {
	constructor(
		public readonly repositoryId: string,
		public readonly ownerId: string | undefined,
		public readonly authToken: string,
	) {}
}

export class CreateRepositoryCommand {
	constructor(
		public readonly repositoryData: Pick<
			Repository,
			"name" | "visibility" | "description" | "id"
		>,
		public readonly authToken: string,
	) {}
}

export class UpdateRepositoryCommand {
	constructor(
		public readonly repositoryId: string,
		public readonly repositoryData: Partial<Repository>,
		public readonly userId: string,
		public readonly authToken: string,
	) {}
}
