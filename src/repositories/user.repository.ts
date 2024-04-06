import type { Prisma, PrismaClient, User as PrismaUser } from "@prisma/client";
import {
	type CollaboratorDetailed,
	type Commit,
	type Follow,
	type Issue,
	type Member,
	type PullRequest,
	type Star,
	type UserBasic,
	UserRole,
} from "../models";
import type {
	FindAllOptions,
	IRepository,
	IncludeOptions,
} from "./repository.interface";
import { buildUserIncludeOptions } from "./utils/repository.utils";

type UserWithRelations = Omit<
	PrismaUser,
	| "followers"
	| "following"
	| "issues"
	| "stars"
	| "collaborators"
	| "comments"
	| "notifications"
	| "memberships"
	| "pullRequests"
	| "pullRequestsAuthored"
	| "commits"
> & {
	followers: Follow[];
	following: Follow[];
	issues: Issue[];
	stars: Star[];
	collaborators: CollaboratorDetailed[];
	comments: Comment[];
	notifications: Notification[];
	memberships: Member[];
	pullRequests: PullRequest[];
	pullRequestsAuthored: PullRequest[];
	commits: Commit[];
	pullRequest: PullRequest | null;
	pullRequestId: number | null;
};

function isUserWithRelations(obj: {
	[k: string]: unknown;
}): obj is UserWithRelations {
	return (
		"followers" in obj &&
		"following" in obj &&
		"issues" in obj &&
		"stars" in obj &&
		"collaborators" in obj &&
		"comments" in obj &&
		"notifications" in obj &&
		"memberships" in obj &&
		"pullRequests" in obj &&
		"pullRequestsAuthored" in obj &&
		"commits" in obj &&
		"pullRequest" in obj &&
		"pullRequestId" in obj
	);
}

interface UserRepository
	extends IRepository<
		UserBasic,
		Prisma.UserCreateInput,
		Prisma.UserUpdateInput,
		Prisma.UserCreateManyInput,
		Prisma.UserWhereUniqueInput,
		Prisma.UserWhereInput
	> {}

export class UserRepositoryImpl implements UserRepository {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async findById(
		id: number | undefined,
		include?: IncludeOptions<UserBasic>,
	): Promise<UserBasic | undefined> {
		// const includeOpts: Prisma.UserInclude = buildUserIncludeOptions(include);

		// const res = await this.prisma.user.findUnique({
		// 	where: { id },
		// 	include: includeOpts,
		// });

		// if (!res) return undefined;

		// if (isUserWithRelations(res)) {
		// 	const { _count, ...userWithRelations } = res;
		// 	return { ...userWithRelations };
		// }

		// throw new Error("Unexpected data structure from Prisma");
		throw new Error("Method not implemented.");
	}

	async findAll(
		options: FindAllOptions<UserBasic, Prisma.UserWhereInput>,
	): Promise<{ items: UserBasic[]; totalCount: number }> {
		const { limit, page, search, skip } = options;
		const whereClause: Prisma.UserWhereInput = {};

		if (search) {
			whereClause.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ username: { contains: search, mode: "insensitive" } },
				{ public_email: { contains: search, mode: "insensitive" } },
				// @TODO include more fields?
			];
		}

		const parsedPage = Math.max(1, page || 1);
		const parsedLimit = Math.min(100, Math.max(1, limit || 20));
		const parsedSkip = skip || 0;

		const users = await this.prisma.user.findMany({
			where: whereClause,
			take: parsedLimit,
			skip: parsedSkip,
			select: {
				id: true,
				name: true,
				username: true,
				public_email: true,
				updated_at: true,
				created_at: true,
				email: true,
				avatar: true,
				bio: true,
				repositories: {
					include: {
						collaborators: true,
						issues: true,
						license: true,
						owner: true,
						tag: true,
						stars: true,
						pull_requests: true,
						organization: true,
					},
				},
			},
		});

		const totalCount = await this.prisma.user.count({
			where: whereClause,
		});

		const items = users.map((user) => ({
			...user,
			role: UserRole.USER,
			id: user.id ?? null,
			repositories: [],
		}));

		return { items, totalCount };
	}

	async create(data: Prisma.UserCreateInput): Promise<UserBasic> {
		return {
			...(await this.prisma.user.create({ data })),
			repositories: [],
			role: UserRole.USER,
		};
	}

	async createMany(data: Prisma.UserCreateManyInput[]): Promise<number> {
		return (await this.prisma.user.createMany({ data })).count;
	}

	async update(
		id: number | undefined,
		data: Prisma.UserUpdateInput,
	): Promise<UserBasic> {
		return {
			...(await this.prisma.user.update({ where: { id }, data })),
			role: UserRole.USER,
			repositories: [],
		};
	}

	async delete(params: { where: Prisma.UserWhereUniqueInput }): Promise<
		Partial<UserBasic>
	> {
		const { where } = params;
		return {
			...(await this.prisma.user.delete({ where })),
			role: UserRole.USER,
		};
	}
}
