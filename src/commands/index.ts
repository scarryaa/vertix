export abstract class BaseCommand<T> {
	public id: string;

	constructor(id: string) {
		this.id = id;
	}
}
