import { Controller, Inject } from "@tsed/di";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Delete, Get, Patch, Post, Put } from "@tsed/schema";
import { CreateUserCommand } from "../../../CQRS/commands/CreateUserCommand";
import { CreateUserCommandHandler } from "../../../CQRS/commands/handlers/CreateUserCommandHandler";
import { GetAllUsersQuery } from "../../../CQRS/queries/GetAllUsersQuery";
import { GetAllUsersQueryHandler } from "../../../CQRS/queries/handlers/GetAllUsersQueryHandler";

@Controller("/users")
export class UserController {
	@Inject(GetAllUsersQueryHandler)
	private readonly queryHandler: GetAllUsersQueryHandler;
	@Inject(CreateUserCommandHandler)
	private readonly commandHandler: CreateUserCommandHandler;

	@Get("/")
	async get() {
		return await this.queryHandler.execute(new GetAllUsersQuery());
	}

	@Get("/:userId")
	getById(@PathParams("userId") userId: string) {
		return "Specific user";
	}

	@Post("/")
	create(
		@BodyParams() command: CreateUserCommand,
	) {
		this.commandHandler.handle(
			new CreateUserCommand(
				command.username,
				command.email,
				command.name,
				command.password,
				command.role,
			),
		);
	}

	@Put("/:userId")
	update(@PathParams("userId") userId: string) {
		return "Updated user";
	}

	@Patch("/:userId")
	patch(@PathParams("userId") userId: string) {
		return "Patched user";
	}

	@Delete("/:userId")
	delete(@PathParams("userId") userId: string) {
		return "Deleted user";
	}
}
