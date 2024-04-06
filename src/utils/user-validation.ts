import prisma from "./prisma";

export async function checkOwnerExists(ownerId: number): Promise<boolean> {
	const owner = await prisma.user.findFirst({ where: { id: ownerId } });
	return !!owner;
}
