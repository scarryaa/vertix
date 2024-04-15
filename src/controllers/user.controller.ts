import type { CreateUserCommand } from "../commands/create-user.command";
import type { DeleteUserCommand } from "../commands/delete-user.command";
import type { CreateUserCommandHandler } from "../commands/handlers/create-user.command.handler";
import type { DeleteUserCommandHandler } from "../commands/handlers/delete-user.command.handler";
import type { UpdateUserCommandHandler } from "../commands/handlers/update-user.command.handler";
import type { UpdateUserCommand } from "../commands/update-user.command";
import { GetUserQuery } from "../queries/get-user.query";
import type { GetAllUsersQueryHandler } from "../queries/handlers/get-all-users.query.handler";
import type { GetUserQueryHandler } from "../queries/handlers/get-user.query.handler";

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
