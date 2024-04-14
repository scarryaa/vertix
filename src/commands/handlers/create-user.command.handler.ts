import { BaseCommandHandler } from ".";
import { UserAggregate } from "../../aggregrates/user.aggregrate";
import { UserEventFactory } from "../../events/user-factory.event";
import { generateUuid } from "../../util";
import type { CreateUserCommand } from "../create-user.command";

export class CreateUserCommandHandler extends BaseCommandHandler {
	async handle(command: CreateUserCommand) {
		const user = new UserAggregate(command.id);

		const event = UserEventFactory.createUserEvent({
			userId: command.id,
			email: command.email,
			name: command.name,
			username: command.username,
			password: command.password,
		});

		user.applyUserCreatedEvent(event);

		await this.eventStore.save(event);
	}
}
