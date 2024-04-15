export abstract class AggregateRoot {
	id: string;

	constructor(id: string) {
		this.id = id;
	}

	public apply(event: any): void {
		this.applyEvent(event);
	}

	protected abstract applyEvent(event: any): void;
}
