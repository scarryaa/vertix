import prisma from "./prisma";

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
			AND: [{ name }, { owner_id: ownerId }],
		},
	});
	return !!existingRepository;
}
