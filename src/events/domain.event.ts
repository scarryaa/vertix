export class DomainEvent {
	constructor(
		public readonly id: string,
		public readonly type: string,
		public readonly timestamp: Date,
		public readonly payload: unknown,
		public readonly userId?: string,
		public readonly username?: string,
	) {
		this.type = "DomainEvent";
	}
}
