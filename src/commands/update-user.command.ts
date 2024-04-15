export class UpdateUserCommand {
	public id: string;
	public username: string;
	public password: string;
	public email: string;
	public name: string;

	constructor(params: {
		userId: string;
		username: string;
		password: string;
		email: string;
		name: string;
	}) {
		this.id = params.userId;
		this.username = params.username;
		this.password = params.password;
		this.email = params.email;
		this.name = params.name;
	}
}
