import { Inject, Service } from "@tsed/di";
import { $log } from "@tsed/logger";
import { EventRepository } from "../repositories/EventRepository";
import { EventPublisher } from "./EventPublisher";
import { UserCreatedEvent } from "./UserCreatedEvent";

@Service()
export class EventHandler {
	@Inject(EventPublisher)
	private eventPublisher: EventPublisher;
	@Inject(EventRepository)
	private eventRepository: EventRepository;

    constructor() {
        this.setupEvents();
    }

	setupEvents() {
		this.eventPublisher.on("UserCreatedEvent", (payload: any) => {
            $log.info("UserCreatedEvent", payload);
			this.eventRepository.saveEvent(
				new UserCreatedEvent(
					payload.userId,
					payload.name,
					payload.email,
					payload.username,
					payload.role,
					payload.password,
				),
			);
		});
	}
}
