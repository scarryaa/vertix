import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
	if (params.model === "User" && params.action === "create") {
		const user = params.args.data;

		const userPreference = await prisma.userPreference.create({
			data: {
				theme: "system",
				show_public_email: false,
			},
		});

		user.userPreferenceId = userPreference.id;
		console.log(userPreference);
	}

	return next(params);
});

export default prisma;
