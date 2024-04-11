import { randomUUID } from "node:crypto";
import AWS from "aws-sdk";
import {
	FileCreateFailedEvent,
	FileDeleteFailedEvent,
	FileUpdateFailedEvent,
} from "../../events/file.event";
import { GenericErrorEvent } from "../../events/generic.events";

interface FileServiceConfig {
	storagePath: string;
}

export class FileService {
	private s3: AWS.S3;
	private bucketName: string;

	constructor(config: FileServiceConfig) {
		AWS.config.update({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: process.env.AWS_REGION,
		});

		this.s3 = new AWS.S3();
		this.bucketName = config.storagePath;
	}

	/**
	 * Uploads a file to the specified S3 bucket.
	 *
	 * This method constructs a request to upload a file to the AWS S3 bucket using the provided
	 * file path and file content. It then sends this request and awaits its completion to ensure
	 * the file is successfully uploaded.
	 *
	 * @param filePath The path where the file will be stored within the bucket.
	 * @param fileContent The content of the file as a Buffer.
	 * @returns A promise that resolves once the file has been successfully uploaded.
	 */
	async uploadFile(filePath: string, fileContent: Buffer): Promise<void> {
		// @TODO make this atomic or roll it back if it fails
		try {
			const params = {
				Bucket: this.bucketName,
				Key: filePath,
				Body: fileContent,
			};

			await this.s3.putObject(params).promise();
		} catch (error) {
			this.handleFileError(error, {
				fileId: randomUUID(),
				fileName: filePath,
			});
		}
	}

	/**
	 * Downloads a file from the specified S3 bucket.
	 *
	 * This method constructs a request to download a file from the AWS S3 bucket
	 * using the file path provided. It then sends this request and awaits the response
	 * to retrieve the file content as a Buffer.
	 *
	 * @param filePath The path of the file to be downloaded within the bucket.
	 * @returns A promise that resolves with the file content as a Buffer.
	 */
	async downloadFile(filePath: string): Promise<Buffer | null> {
		try {
			const params = {
				Bucket: this.bucketName,
				Key: filePath,
			};
			const data = await this.s3.getObject(params).promise();
			return data.Body as Buffer;
		} catch (error) {
			console.error(
				"%s: Error downloading file %s",
				this.constructor.name,
				filePath,
			);
			this.handleFileError(error, {
				fileId: randomUUID(),
				fileName: filePath,
			});

			return null;
		}
	}

	/**
	 * Deletes a file from the specified S3 bucket.
	 *
	 * This method constructs a request to delete a file from the AWS S3 bucket
	 * using the file path provided. It then sends this request and awaits its completion.
	 *
	 * @param filePath The path of the file to be deleted within the bucket.
	 * @returns A promise that resolves once the file has been successfully deleted.
	 */
	async deleteFile(filePath: string): Promise<void> {
		try {
			const params = {
				Bucket: this.bucketName,
				Key: filePath,
			};

			await this.s3.deleteObject(params).promise();
		} catch (error) {
			this.handleFileError(error, {
				fileId: randomUUID(),
				fileName: filePath,
			});
		}
	}

	async renameFile(oldPath: string, newPath: string): Promise<void> {
		const params = {
			Bucket: this.bucketName,
			Key: oldPath,
			NewKey: newPath,
		};

		// @TODO make this atomic or roll it back if it fails
		try {
			await this.s3
				.copyObject({ CopySource: `${this.bucketName}/${oldPath}`, ...params })
				.promise();
			await this.s3.deleteObject(params).promise();
		} catch (error) {
			this.handleFileError(error, {
				fileName: oldPath,
			});
		}
	}

	/**
	 * Creates a folder within the specified S3 bucket to represent a repository.
	 *
	 * This method simulates the creation of a folder in S3 by uploading a zero-byte object
	 * with a key that ends in a slash.
	 *
	 * @param repositoryName The name of the repository for which to create the folder. This name
	 *                       is used as part of the object key to simulate the folder structure.
	 * @returns A promise that resolves once the folder has been successfully created.
	 */
	async createRepositoryFolder(repositoryName: string): Promise<void> {
		const params = {
			Bucket: this.bucketName,
			Key: `${repositoryName}/`,
		};
		await this.s3.putObject(params).promise();
	}

	private handleFileError(error: unknown, payload: any) {
		let errorEvent:
			| FileCreateFailedEvent
			| FileDeleteFailedEvent
			| FileUpdateFailedEvent
			| GenericErrorEvent<unknown>;

		if (
			error instanceof FileCreateFailedEvent ||
			error instanceof FileUpdateFailedEvent ||
			error instanceof FileDeleteFailedEvent
		) {
			errorEvent = new FileCreateFailedEvent(
				randomUUID(),
				new Date(),
				payload,
				error.reason,
			);
		} else if (error instanceof Error) {
			errorEvent = new GenericErrorEvent(
				randomUUID(),
				new Date(),
				payload,
				error.message,
			);
		} else {
			errorEvent = new GenericErrorEvent(
				randomUUID(),
				new Date(),
				payload,
				JSON.stringify(error),
			);
		}
	}
}
