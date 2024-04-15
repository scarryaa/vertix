import { BaseCommandHandler } from ".";
import { UserAggregate } from "../../aggregrates/user.aggregrate";
import { AlreadyExistsError } from "../../errors/already-exists.error";
import type { EventStore } from "../../events/store.event";
import { UserEventFactory } from "../../events/user-factory.event";
import type { CreateUserPayload } from "../../events/user.event";
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

	async ensureUserDoesNotExist(command: CreateUserCommand) {
		const userEvents =
			await this.eventStore.loadEventsForAggregate<Partial<CreateUserPayload>>({
				payload: {
					_or: [
						{
                            email: command.email,
                        },
                        {
                            username: command.username,
                        },
                    ],
				}
			});
			
		if (userEvents.length) {
			throw new AlreadyExistsError("User with this username or email already exists.");
		}
	}
}
