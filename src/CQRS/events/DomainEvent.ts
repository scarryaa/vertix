import type { EventVisitor } from "./EventVisitor";

export abstract class DomainEvent {
	abstract accept(visitor: EventVisitor): void;
}
