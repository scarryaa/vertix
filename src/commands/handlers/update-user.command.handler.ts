import bcrypt from "bcrypt";
import { BaseCommandHandler } from ".";
import { UserAggregate } from "../../aggregrates/user.aggregrate";
import { Config } from "../../config";
import { DoesNotExistError } from "../../errors/does-not-exist.error";
import type { EventStore } from "../../events/store.event";
import { UserEventFactory } from "../../events/user-factory.event";
import type { UpdateUserCommand } from "../update-user.command";

export class UpdateUserCommandHandler extends BaseCommandHandler {
	protected eventStore: EventStore;

	constructor(eventStore: EventStore) {
		super(eventStore);
		this.eventStore = eventStore;
	}

	async handle(command: UpdateUserCommand) {
		await this.ensureUserExists(command.id);

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
        this.eventStore.save(event);
		user.applyUserUpdatedEvent(event);
	}

	async ensureUserExists(userId: string) {
		// Check if the user exists
		const userEvents = await this.eventStore.loadEventsForAggregate({ aggregateId: userId });
		if (!userEvents.length) {
			throw new DoesNotExistError("User does not exist.");
		}
	}
}
