import { Service } from "@tsed/di";
import type { UserAggregateRoot } from "../aggregrate-roots/UserAggregateRoot";

@Service()
export class UserReadModel {
	private users: UserAggregateRoot[] = [];

	getAllUsers(): UserAggregateRoot[] {
		return this.users;
	}
}
