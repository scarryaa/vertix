import bcrypt from "bcrypt";
import { UserAggregate } from "../../../aggregrates/user.aggregrate";
import { Config } from "../../../config";
import { AlreadyExistsError } from "../../../errors/already-exists.error";
import type { EventStore } from "../../../events/store.event";
import { UserEventFactory } from "../../../events/user-factory.event";
import type { CreateUserPayload } from "../../../events/user.event";
import { BaseCommandHandler } from "../../handlers";
import type { CreateUserCommand } from "../create-user.command";

export class CreateUserCommandHandler extends BaseCommandHandler {
	protected eventStore: EventStore;

	constructor(eventStore: EventStore) {
		super(eventStore);
		this.eventStore = eventStore;
	}
	async handle(command: CreateUserCommand) {
		// Check if user already exists
		await this.ensureUserDoesNotExist(command);

		const user = new UserAggregate(command.id);

		const hashedPassword = await bcrypt.hash(
			command.password,
			Config.saltRounds,
		);

		const event = UserEventFactory.createUserEvent({
			userId: command.id,
			email: command.email,
			name: command.name,
			username: command.username,
			password: hashedPassword,
		});

		await this.eventStore.save(event);
		user.applyUserCreatedEvent(event);
		$logger.info("User created");
	}

	async ensureUserDoesNotExist(command: CreateUserCommand) {
		const userEvents = await this.eventStore.loadEventsForAggregate<
			Partial<CreateUserPayload>
		>({
			payload: {
				_or: [
					{
						email: command.email,
					},
					{
						username: command.username,
					},
				],
			},
		});

		if (userEvents.length) {
			throw new AlreadyExistsError(
				"User with this username or email already exists.",
			);
		}
	}
}
