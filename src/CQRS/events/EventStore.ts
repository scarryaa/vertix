import { Service } from "@tsed/di";
import { $log } from "@tsed/logger";
import type { Repository } from "typeorm";
import { postgresDatasource } from "../../datasources/PostgresDatasource";
import { EventEntity } from "../../entity/EventEntity";

@Service()
export class EventStore {
	private eventRepository: Repository<EventEntity>;

	constructor() {
		this.eventRepository = postgresDatasource.getRepository(EventEntity);
	}

	async save(event: EventEntity): Promise<void> {
		await this.eventRepository.save(event);
		this.logAllEvents();
	}

	findEventsForAggregate(aggregateId: string): Promise<EventEntity[]> {
		return this.eventRepository.find({
			where: { aggregateId },
			order: { timestamp: "ASC" },
		});
	}

    logAllEvents(): Promise<void> {
        return this.eventRepository.find().then(events => {
            for (const event of events) {
                $log.info("Event", event);
            }
        });
    }
}
