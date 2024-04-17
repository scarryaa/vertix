import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { Config } from "../config";

export class S3Service {
	private static instance: S3Service;
	private s3!: S3Client;
	private region: string;
	private bucket: string;

	private constructor() {
		this.region = "us-east-1";
		this.bucket = "codestash";
	}

	static getInstance(options?: {
		region?: string;
		bucket?: string;
	}): S3Service {
		if (!S3Service.instance) {
			S3Service.instance = new S3Service();

			if (options?.bucket) {
				S3Service.instance.bucket = options.bucket;
			}

			if (options?.region) {
				S3Service.instance.region = options.region;
			}
		}

		return S3Service.instance;
	}

	public configure(options: { region: string; bucket: string }): void {
		this.region = options.region;
		this.bucket = options.bucket;

		this.s3 = new S3Client({
			region: this.region,
			credentials: {
				accessKeyId: Config.awsAccessKeyId,
				secretAccessKey: Config.awsSecretAccessKey,
			},
		});
	}

	public async uploadFile(file: any, fileName: string): Promise<void> {
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: fileName,
			Body: file,
		});

		await this.s3.send(command);
	}

	public async downloadFile(key: string): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});

		const data = await this.s3.send(command);

		if (!data.Body) {
			throw new Error("File not found");
		}

		return data.Body.transformToString();
	}

	public async deleteFile(key: string): Promise<void> {
		const command = new DeleteObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});

		await this.s3.send(command);
	}
}
