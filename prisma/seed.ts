import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
	const numberOfUsers = 30;

	for (let i = 0; i < numberOfUsers; i++) {
		const firstName = faker.person.firstName();
		await prisma.user.upsert({
			where: { email: faker.internet.email({ firstName }) },
			update: {},
			create: {
				email: faker.internet.email({ firstName }),
				name: `${firstName} ${faker.person.lastName()}`,
				password: faker.internet.password(),
				username: faker.internet.userName({ firstName }),
			},
		});
	}

	const numberOfRepositories = 50;
	for (let i = 0; i < numberOfRepositories; i++) {
		await prisma.repository.upsert({
			where: {
				name: faker.lorem.word(),
				id: faker.string.uuid(),
			},
			update: {},
			create: {
				name: faker.lorem.word(),
				description: faker.lorem.sentence(),
				visibility: faker.helpers.arrayElement(["public", "private"]),
				owner_id: faker.string.uuid(),
			},
		});
	}
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
