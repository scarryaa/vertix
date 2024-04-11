import type { PrismaClient } from "@prisma/client";

export class SnapshotRepository<T> {
	private prisma: PrismaClient;
	private model: string;

	constructor(prisma: PrismaClient, model: string) {
		this.prisma = prisma;
        this.model = model;
	}

	async createSnapshot(snapshotData: T): Promise<T> {
		return (this.prisma as any)[this.model].create({
			data: snapshotData,
		});
	}

	async deleteSnapshot(snapshotId: string): Promise<void> {
		await (this.prisma as any)[this.model].delete({
			where: { id: snapshotId },
		});
	}

	async getSnapshot(snapshotId: string): Promise<T | null> {
		return (this.prisma as any)[this.model].findUnique({
			where: { id: snapshotId },
		});
	}
}
