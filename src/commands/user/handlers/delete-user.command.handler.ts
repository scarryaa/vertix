import type { BaseCommand } from "../..";
import { UserAggregate } from "../../../aggregrates/user.aggregrate";
import { UserEventFactory } from "../../../events/user-factory.event";
import { BaseCommandHandler } from "../../handlers";
import type { DeleteUserCommand } from "../delete-user.command";
import { ensureUserExists } from "../validation";

export class DeleteUserCommandHandler extends BaseCommandHandler {
	async handle(command: BaseCommand<DeleteUserCommand>): Promise<void> {
		await ensureUserExists(this.eventStore)(command.id);

		const user = new UserAggregate(command.id);

		const event = UserEventFactory.deleteUserEvent({
			userId: command.id,
		});

		await this.eventStore.save(event);
		user.applyUserDeletedEvent(event);

		$logger.info("User deleted");
	}
}
