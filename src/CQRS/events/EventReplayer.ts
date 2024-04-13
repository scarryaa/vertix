import { Inject, Service } from "@tsed/di";
import { AggregateRootFactory } from "../aggregrate-roots/AggregateRootFactory";
import type { IAggregateRoot } from "../aggregrate-roots/BaseAggregateRoot";
import { EventStore } from "./EventStore";

@Service()
export class EventReplayer {
	@Inject(EventStore)
    private eventStore: EventStore;

	async replay(
		aggregateId: string,
		aggregateTypeKey: string,
	): Promise<IAggregateRoot> {
		const events = await this.eventStore.findEventsForAggregate(aggregateId);
		const aggregate =
			AggregateRootFactory.createAggregateRoot(aggregateTypeKey);

		if (!aggregate) {
			throw new Error("Unable to instantiate aggregate root.");
		}

		for (const event of events) {
			const domainEvent = JSON.parse(event.payload);
			aggregate.apply(domainEvent);
		}

		return aggregate;
	}
}
