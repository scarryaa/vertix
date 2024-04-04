import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function isRepositoryNameValid(name: string): boolean {
	const regex = /^[a-zA-Z0-9-]+$/;
	return regex.test(name);
}

export async function checkRepositoryExists(
    name: string,
    ownerId: number,
): Promise<boolean> {
    const existingRepository = await prisma.repository.findFirst({
        where: {
            AND: [{ name }, { ownerId }],
        },
    });
    return !!existingRepository;
}

export async function checkOwnerExists(ownerId: number): Promise<boolean> {
    const owner = await prisma.user.findFirst({ where: { id: ownerId } });
    return !!owner;
}
