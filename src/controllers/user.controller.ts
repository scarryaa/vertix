import type { CreateUserCommand } from "../commands/create-user.command";
import type { DeleteUserCommand } from "../commands/delete-user.command";
import type { CreateUserCommandHandler } from "../commands/handlers/create-user.command.handler";
import type { DeleteUserCommandHandler } from "../commands/handlers/delete-user.command.handler";
import type { GetAllUsersQueryHandler } from "../queries/handlers/get-all-users.query.handler";

export class UserController {
	private createUserCommandHandler: CreateUserCommandHandler;
	private deleteUserCommandHandler: DeleteUserCommandHandler;
	private getAllUsersQueryHandler: GetAllUsersQueryHandler;

	constructor(
		createUserCommandHandler: CreateUserCommandHandler,
		deleteUserCommandHandler: DeleteUserCommandHandler,
		getAllUsersQueryHandler: GetAllUsersQueryHandler,
	) {
		this.createUserCommandHandler = createUserCommandHandler;
		this.deleteUserCommandHandler = deleteUserCommandHandler;
		this.getAllUsersQueryHandler = getAllUsersQueryHandler;
	}

	async createUser(command: CreateUserCommand) {
		await this.createUserCommandHandler.handle(command);
	}

	async deleteUser(command: DeleteUserCommand) {
		await this.deleteUserCommandHandler.handle(command);
	}

	async getAllUsers() {
		// Get all users
		const users = await this.getAllUsersQueryHandler.handle();

		return users;
	}
}
