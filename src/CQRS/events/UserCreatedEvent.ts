import type { UserRole } from "../../entity/User";
import { DomainEvent } from "./DomainEvent";
import type { EventVisitor } from "./EventVisitor";

export class UserCreatedEvent extends DomainEvent {
	public readonly userId: string;
	public readonly name: string;
	public readonly email: string;
	public readonly username: string;
	public readonly role: UserRole;
	public readonly password: string;

	constructor(
		userId: string,
		name: string,
		email: string,
		username: string,
		role: UserRole,
		password: string,
	) {
        super();
		this.userId = userId;
		this.name = name;
		this.email = email;
		this.username = username;
		this.role = role;
		this.password = password;
	}

	accept(visitor: EventVisitor): void {
        visitor.visitUserCreatedEvent(this);
	}
}
