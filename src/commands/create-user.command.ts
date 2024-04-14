import { BaseCommand } from ".";

export class CreateUserCommand extends BaseCommand<CreateUserCommand> {
	public id: string;
	public username: string;
	public password: string;
	public email: string;
	public name: string;

	constructor(
		id: string,
		username: string,
		password: string,
		email: string,
		name: string,
	) {
		super(id);
		this.id = id;
		this.username = username;
		this.password = password;
		this.email = email;
		this.name = name;
	}
}
