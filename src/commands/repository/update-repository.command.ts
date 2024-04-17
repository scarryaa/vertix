import { BaseCommand } from "..";

export class UpdateRepositoryCommand extends BaseCommand<UpdateRepositoryCommand> {
	public id: string;
	public authorId: string;
	public name: string;
	public description: string;
	public private: boolean;

	constructor(
		id: string,
		authorId: string,
		name: string,
		description: string,
		_private: boolean,
	) {
		super(id);
		this.id = id;
		this.authorId = authorId;
		this.name = name;
		this.description = description;
		this.private = _private;
	}
}
