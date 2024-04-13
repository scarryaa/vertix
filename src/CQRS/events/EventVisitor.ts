import type { UserCreatedEvent } from "./UserCreatedEvent";

export interface EventVisitor {
	visitUserCreatedEvent(event: UserCreatedEvent): void;
	// visitUserUpdatedEvent(event: UserUpdatedEvent): void;
}
