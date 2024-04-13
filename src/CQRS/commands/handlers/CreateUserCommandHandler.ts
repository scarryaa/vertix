import { randomUUID } from "node:crypto";
import { Inject, Service } from "@tsed/di";
import { User, UserRole } from "../../../entity/User";
import { EventPublisher } from "../../events/EventPublisher";
import type { CreateUserCommand } from "../CreateUserCommand";

@Service()
export class CreateUserCommandHandler {
	@Inject(EventPublisher)
	private eventPublisher: EventPublisher;

	async handle(command: CreateUserCommand) {
		const newUser = User.create({
			username: command.username,
			email: command.email,
			name: command.name,
			password: command.password,
			role: UserRole.User,
		});

		await this.eventPublisher.publish({
			aggregateId: randomUUID(),
			id: randomUUID(),
			eventType: "UserCreatedEvent",
			payload: newUser,
			timestamp: new Date(),
		});
	}
}
