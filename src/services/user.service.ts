import type { UserRepositoryImpl } from "../repositories/user.repository";

export class UserService {
	constructor(private userRepo: UserRepositoryImpl) {};

    async findById(userId: number) {
        return await this.userRepo.findById(userId);
    }
}
