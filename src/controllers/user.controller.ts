import type { CreateUserCommand } from "../commands/user/create-user.command";
import type { DeleteUserCommand } from "../commands/user/delete-user.command";
import type { CreateUserCommandHandler } from "../commands/user/handlers/create-user.command.handler";
import type { DeleteUserCommandHandler } from "../commands/user/handlers/delete-user.command.handler";
import type { UpdateUserCommandHandler } from "../commands/user/handlers/update-user.command.handler";
import type { UpdateUserCommand } from "../commands/user/update-user.command";
import { GetUserQuery } from "../queries/user/get-user.query";
import type { GetAllUsersQueryHandler } from "../queries/user/handlers/get-all-users.query.handler";
import type { GetUserQueryHandler } from "../queries/user/handlers/get-user.query.handler";

export class UserController {
	private createUserCommandHandler: CreateUserCommandHandler;
	private deleteUserCommandHandler: DeleteUserCommandHandler;
	private updateUserCommandHandler: UpdateUserCommandHandler;
	private getAllUsersQueryHandler: GetAllUsersQueryHandler;
	private getUserQueryHandler: GetUserQueryHandler;

	constructor(
		createUserCommandHandler: CreateUserCommandHandler,
		deleteUserCommandHandler: DeleteUserCommandHandler,
		getAllUsersQueryHandler: GetAllUsersQueryHandler,
		getUserQueryHandler: GetUserQueryHandler,
		updateUserCommandHandler: UpdateUserCommandHandler,
	) {
		this.createUserCommandHandler = createUserCommandHandler;
		this.deleteUserCommandHandler = deleteUserCommandHandler;
		this.getAllUsersQueryHandler = getAllUsersQueryHandler;
		this.getUserQueryHandler = getUserQueryHandler;
		this.updateUserCommandHandler = updateUserCommandHandler;
	}

	async createUser(command: CreateUserCommand) {
		await this.createUserCommandHandler.handle(command);
	}

	async deleteUser(command: DeleteUserCommand) {
		await this.deleteUserCommandHandler.handle(command);
	}

	async updateUser(command: UpdateUserCommand) {
		await this.updateUserCommandHandler.handle(command);
	}

	async getAllUsers() {
		// Get all users
		const users = await this.getAllUsersQueryHandler.handle();

		return users;
	}

	async getUser(params: GetUserQuery) {
		const query = new GetUserQuery(params.userId);
		await this.getUserQueryHandler.handle(query);
	}
}
