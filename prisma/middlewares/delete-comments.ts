import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
	if (params.action === "delete" && params.model === "User") {
		const user_id = params.args.where.id;

		// Update all comments associated with the deleted user
		await prisma.comment.updateMany({
			where: { author_id: user_id },
			data: { deleted_user: true },
		});
	}

	return next(params);
});
