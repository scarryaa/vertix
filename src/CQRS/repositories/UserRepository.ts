import { Injectable } from "@tsed/di";
import type { DataSource } from "typeorm";
import { User } from "../../entity/User";
import { BaseRepository } from "./BaseRepository";

@Injectable()
export class UserRepository extends BaseRepository<User> {
	constructor(private dataSource: DataSource) {
		super(User, dataSource);
	}
	
	async findByEmail(email: string): Promise<User | undefined> {
		return await this.findOne({ where: { email } });
	}

	async saveUser(user: User): Promise<User> {
		return await this.save(user);
	}
}
