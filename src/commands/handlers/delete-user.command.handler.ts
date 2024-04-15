import { BaseCommandHandler } from ".";
import type { BaseCommand } from "..";
import { UserAggregate } from "../../aggregrates/user.aggregrate";
import { UserEventFactory } from "../../events/user-factory.event";
import type { DeleteUserCommand } from "../delete-user.command";

export class DeleteUserCommandHandler extends BaseCommandHandler {
	handle(command: BaseCommand<DeleteUserCommand>): Promise<void> {
		const user = new UserAggregate(command.id);

		const event = UserEventFactory.deleteUserEvent({
			userId: command.id,
		});

		user.applyUserDeletedEvent(event);

		return this.eventStore.save(event);
	}
}
