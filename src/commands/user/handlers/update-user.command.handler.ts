import bcrypt from "bcrypt";
import { UserAggregate } from "../../../aggregrates/user.aggregate";
import { Config } from "../../../config";
import type { EventStore } from "../../../events/store.event";
import { UserEventFactory } from "../../../events/user-factory.event";
import { BaseCommandHandler } from "../../handlers";
import type { UpdateUserCommand } from "../update-user.command";
import { ensureUpdatedUserDoesNotExist, ensureUserExists } from "../validation";

export class UpdateUserCommandHandler extends BaseCommandHandler {
	protected eventStore: EventStore;

	constructor(eventStore: EventStore) {
		super(eventStore);
		this.eventStore = eventStore;
	}

	async handle(command: UpdateUserCommand) {
		await ensureUserExists(this.eventStore)(command.id);
		await ensureUpdatedUserDoesNotExist(this.eventStore)(
			command.email,
			command.username,
		);

		const user = new UserAggregate(command.id);
		const input: {
			userId: string;
			username?: string;
			password?: string;
			email?: string;
			name?: string;
		} = {
			userId: command.id,
		};

		if (command.username) {
			input.username = command.username;
		}

		if (command.password) {
			const hashedPassword = await bcrypt.hash(
				command.password,
				Config.saltRounds,
			);
			input.password = hashedPassword;
		}

		if (command.email) {
			input.email = command.email;
		}

		if (command.name) {
			input.name = command.name;
		}

		const event = UserEventFactory.updateUserEvent(input);
		await this.eventStore.save(event);
		await user.applyEvent(event);
	}
}
