export interface FileEvent<PayloadType> {
	id: string;
	type: string;
	timestamp: Date;
	payload: PayloadType;
}

export interface FilePayload {
	fileId: string;
	fileName: string;
	fileSize: number;
	fileContentType: string;
	userId: string;
}

export class FileCreatedEvent implements FileEvent<FilePayload> {
	type: string;

	constructor(
		public readonly id: string,
		public readonly timestamp: Date,
		public readonly payload: FilePayload,
		public readonly reason: string,
	) {
		this.type = "FileCreated";
	}
}

export class FileUpdatedEvent implements FileEvent<FilePayload> {
	type: string;

	constructor(
		public readonly id: string,
		public readonly timestamp: Date,
		public readonly payload: FilePayload,
		public readonly reason: string,
	) {
		this.type = "FileUpdated";
	}
}

export class FileDeletedEvent implements FileEvent<FilePayload> {
	type: string;

	constructor(
		public readonly id: string,
		public readonly timestamp: Date,
		public readonly payload: FilePayload,
		public readonly reason: string,
	) {
		this.type = "FileDeleted";
	}
}

export class FileCreateFailedEvent extends Error implements FileEvent<FilePayload> {
	type: string;

	constructor(
		public readonly id: string,
		public readonly timestamp: Date,
		public readonly payload: FilePayload,
		public readonly reason: string,
	) {
        super();
		this.type = "FileCreateFailed";
	}
}

export class FileUpdateFailedEvent extends Error implements FileEvent<FilePayload> {
	type: string;

	constructor(
		public readonly id: string,
		public readonly timestamp: Date,
		public readonly payload: FilePayload,
		public readonly reason: string,
	) {
        super();
		this.type = "FileUpdateFailed";
	}
}

export class FileDeleteFailedEvent extends Error implements FileEvent<FilePayload> {
	type: string;

	constructor(
		public readonly id: string,
		public readonly timestamp: Date,
		public readonly payload: FilePayload,
		public readonly reason: string,
	) {
        super();
		this.type = "FileDeleteFailed";
	}
}
