import type { UserRepository } from "../repositories/user.repository";

export class UserService {
	constructor(private userRepo: UserRepository) {};

    async findById(userId: number) {
        return await this.userRepo.findById(userId);
    }
}
