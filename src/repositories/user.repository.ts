import type { PrismaClient, User } from "@prisma/client";

export class UserRepository {
    private readonly prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

	async findById(userId: number): Promise<User | null> {
		return this.prisma.user.findFirst({ where: { id: userId } });
	}
}
