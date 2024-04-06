export class BaseError extends Error {
	constructor(
		message: string,
		public code: string,
		public data?: unknown,
	) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}
