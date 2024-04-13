import type { DomainEvent } from "../events/DomainEvent";

export interface IAggregateRoot {
	apply(event: DomainEvent): void;
}