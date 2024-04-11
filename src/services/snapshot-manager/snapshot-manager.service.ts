import type { SnapshotRepository } from "../../repositories/snapshot.repository";

export class SnapshotManager<T extends { id: string }> {
	private readonly snapshots: Map<string, T> = new Map();

	constructor(private readonly repository: SnapshotRepository<T>) {}

	async createSnapshot(snapshot: T): Promise<T> {
		this.snapshots.set(snapshot.id, snapshot);
		return this.repository.createSnapshot(snapshot);
	}

	async deleteSnapshot(snapshotId: string): Promise<void> {
		this.snapshots.delete(snapshotId);
		await this.repository.deleteSnapshot(snapshotId);
	}

	async getSnapshot(snapshotId: string): Promise<T | null> {
		return this.snapshots.get(snapshotId) || null;
	}
}
