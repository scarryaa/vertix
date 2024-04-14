import { BaseCommandHandler } from ".";
import { UserAggregate } from "../../aggregrates/user.aggregrate";
import { UserEventFactory } from "../../events/user-factory.event";

export class DeleteUserCommandHandler extends BaseCommandHandler {
	handle(command: any): Promise<void> {
		const user = new UserAggregate(command.id);

		const event = UserEventFactory.deleteUserEvent({
			userId: command.id,
		});

		user.applyUserDeletedEvent(event);

		return this.eventStore.save(event);
	}
}
