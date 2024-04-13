import { Inject, Service } from "@tsed/di";
import type { UserAggregateRoot } from "../../aggregrate-roots/UserAggregateRoot";
import { UserReadModel } from "../../projections/UserReadModel";
import type { GetAllUsersQuery } from "../GetAllUsersQuery";
import type { IQueryHandler } from "./IQueryHandler";

@Service()
export class GetAllUsersQueryHandler
	implements IQueryHandler<GetAllUsersQuery>
{
	@Inject(UserReadModel)
	private readonly userReadModel: UserReadModel;

	async execute(query: GetAllUsersQuery): Promise<UserAggregateRoot[]> {
		// Fetch all users from the read model
		return await this.userReadModel.getAllUsers();
	}
}
