import type { S3Service } from "./s3.service";

export type Snapshot<T> = {
	id: string;
	version: number;
	eventId: string;
	eventTimestamp: string;
	payload: {
		data: any;
	};
};

export class SnapshotService {
	private static instance: SnapshotService;
	private s3Service!: S3Service;

	configure(s3Service: S3Service) {
		this.s3Service = s3Service;
	}

	static getInstance(): SnapshotService {
		if (!SnapshotService.instance) {
			SnapshotService.instance = new SnapshotService();
		}

		return SnapshotService.instance;
	}

	public async saveSnapshot<T>(snapshot: Snapshot<T>): Promise<void> {
		this.configureS3();

		await this.s3Service.uploadFile(
			JSON.stringify(snapshot),
			`${snapshot.id}.json`,
		);
	}

	public async getSnapshot<T>(id: string): Promise<Snapshot<T> | null> {
		this.configureS3();

		try {
			const data = await this.s3Service.downloadFile(`${id}.json`);

			return JSON.parse(data.toString());
		} catch (error) {
			$logger.warn(`Could not get snapshot for user ${id}`);
			$logger.error(error);
		}

		return null;
	}

	public async deleteSnapshot(id: string): Promise<void> {
		this.configureS3();

		await this.s3Service.deleteFile(`${id}.json`);
	}

	private configureS3() {
		this.s3Service.configure({
			bucket: "codestash-snapshots",
			region: "us-east-1",
		});
	}
}
