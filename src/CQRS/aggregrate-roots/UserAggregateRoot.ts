import { randomUUID } from "crypto";
import { Inject } from "@tsed/di";
import bcrypt from "bcrypt";
import { postgresDatasource } from "../../datasources/PostgresDatasource";
import { EventEntity } from "../../entity/EventEntity";
import type { DomainEvent } from "../events/DomainEvent";
import { EventStore } from "../events/EventStore";
import type { EventVisitor } from "../events/EventVisitor";
import { UserCreatedEvent } from "../events/UserCreatedEvent";
import { UserUpdatedEvent } from "../events/UserUpdatedEvent";

export enum UserRole {
	User = "user",
	Admin = "admin",
}

export class UserAggregateRoot implements EventVisitor {
	@Inject(EventStore)
	private eventStore: EventStore;

	userId: string;
	name: string;
	email: string;
	username: string;
	role: UserRole;
	password: string;

	apply(event: DomainEvent): void {
		event.accept(this);
	}

	visitUserCreatedEvent(event: UserCreatedEvent): void {
		this.userId = event.userId;
		this.name = event.name;
		this.email = event.email;
		this.username = event.username;
		this.role = event.role;
		
		const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
		const salt = bcrypt.genSaltSync(saltRounds);
		this.password = bcrypt.hashSync(event.password, salt);

		this.eventStore.save({
			aggregateId: this.userId,
            eventType: "UserCreatedEvent",
            payload: {
                userId: this.userId,
                name: this.name,
                email: this.email,
                username: this.username,
                role: this.role,
                password: this.password,
            },
            timestamp: new Date(),
			id: randomUUID()
		});
	}

	visitUserUpdatedEvent(event: UserUpdatedEvent): void {
		const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

        // Update properties based on the event
        if (event.name) { this.name = event.name; }
        if (event.email) { this.email = event.email; }
		if (event.username) { this.username = event.username; }
		if (event.role) { this.role = event.role; }
		if (event.password) { this.password = bcrypt.hashSync(event.password, bcrypt.genSaltSync(saltRounds)); }
		
		this.eventStore.save({
			aggregateId: this.userId,
            eventType: "UserUpdatedEvent",
            payload: {
				userId: this.userId,
                name: this.name,
                email: this.email,
                username: this.username,
                role: this.role,
				password: this.password,
            },
            timestamp: new Date(),
			id: randomUUID()
		});
    }

    static async rehydrate(aggregateId: string): Promise<UserAggregateRoot> {
        const events = await postgresDatasource.getRepository(EventEntity).find({
            where: { aggregateId },
            order: { timestamp: "ASC" },
        });

        const aggregate = new UserAggregateRoot();

        for (const eventEntity of events) {
            const payload = JSON.parse(eventEntity.payload);
            let event: DomainEvent;

            // Determine the type of event and instantiate it
            switch (eventEntity.eventType) {
                case 'UserCreatedEvent': {
                    event = new UserCreatedEvent(
                        payload.userId,
                        payload.name,
                        payload.email,
                        payload.username,
                        payload.role,
                        payload.password,
                    );
                    break;
                }
                case 'UserUpdatedEvent': {
                    event = new UserUpdatedEvent(
                        payload.userId,
                        payload.name,
                        payload.email,
						payload.username,
                        payload.role,
                        payload.password,
                    );
                    break;
                }
                default:
                    throw new Error(`Unhandled event type: ${eventEntity.eventType}`);
            }

            aggregate.apply(event);
        }

        return aggregate;
    }
}
