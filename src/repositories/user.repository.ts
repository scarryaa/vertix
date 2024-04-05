import type { Prisma, PrismaClient, User as PrismaUser } from "@prisma/client";
import type {
	Collaborator,
	Commit,
	Follow,
	Issue,
	Member,
	PullRequest,
	Star,
	User,
} from "../models";
import type {
	BaseRepository,
	FindAllOptions,
	RepositoryInclude,
} from "./base.repository";
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
	collaborators: Collaborator[];
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
	extends BaseRepository<
		User,
		Prisma.UserCreateInput,
		Prisma.UserUpdateInput,
		Prisma.UserCreateManyInput,
		{ where: Prisma.UserWhereUniqueInput }
	> {}

export class UserRepositoryImpl implements UserRepository {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async findById(
		id: number | undefined,
		include?: RepositoryInclude<User>,
	): Promise<User | undefined> {
		const includeOpts: Prisma.UserInclude = buildUserIncludeOptions(include);

		const res = await this.prisma.user.findUnique({
			where: { id },
			include: includeOpts,
		});

		if (!res) return undefined;

		if (isUserWithRelations(res)) {
			const { _count, ...userWithRelations } = res;
			return { ...userWithRelations };
		}

		throw new Error("Unexpected data structure from Prisma");
	}

	async findAll(
		options: FindAllOptions<User>,
	): Promise<{ items: Partial<User>[]; totalCount: number }> {
		const { limit, page, search, skip } = options;
		const whereClause: Prisma.UserWhereUniqueInput =
			{} as Prisma.UserWhereUniqueInput;

		if (search) {
			whereClause.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ username: { contains: search, mode: "insensitive" } },
				{ publicEmail: { contains: search, mode: "insensitive" } },
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
		});

		const totalCount = await this.prisma.user.count({
			where: whereClause,
		});

		return { items: users, totalCount };
	}

	async create(data: Prisma.UserCreateInput): Promise<Partial<User>> {
		return await this.prisma.user.create({ data });
	}

	async createMany(data: Prisma.UserCreateManyInput[]): Promise<number> {
		return (await this.prisma.user.createMany({ data })).count;
	}

	async update(
		id: number | undefined,
		data: Prisma.UserUpdateInput,
	): Promise<Partial<User>> {
		return await this.prisma.user.update({ where: { id }, data });
	}

	async delete(params: { where: Prisma.UserWhereUniqueInput }): Promise<
		Partial<User>
	> {
		const { where } = params;
		return await this.prisma.user.delete({ where });
	}
}
