import { EventEmitter } from "node:events";
import { Inject, Service } from "@tsed/di";
import type { EventEntity } from "../../entity/EventEntity";
import { EventStore } from "./EventStore";

@Service()
export class EventPublisher {
    @Inject(EventStore)
	private eventStore: EventStore;
	@Inject(EventEmitter)
	private eventEmitter: EventEmitter;

	async publish(event: EventEntity): Promise<void> {
		await this.eventStore.save(event);
		await this.eventEmitter.emit(event.eventType, event.payload);
	}

	async on(eventType: string, callback: (payload: any) => void): Promise<void> {
		await this.eventEmitter.on(eventType, callback);
	}
}
