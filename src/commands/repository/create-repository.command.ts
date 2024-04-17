import { BaseCommand } from "../..";

export class CreateRepositoryCommand extends BaseCommand<CreateRepositoryCommand> {
	public id: string;
	public name: string;
	public description: string;
	public private: boolean;
	public authorId: string;

	constructor(
		id: string,
		name: string,
		description: string,
		_private: boolean,
		authorId: string,
	) {
		super(id);
		this.id = id;
		this.name = name;
		this.description = description;
		this.private = _private;
		this.authorId = authorId;
	}
}
