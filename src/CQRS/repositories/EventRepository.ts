import { Inject, Injectable } from "@tsed/di";
import { DataSource } from "typeorm";
import { DomainEvent } from "../events/DomainEvent";
import { BaseRepository } from "./BaseRepository";

@Injectable()
export class EventRepository extends BaseRepository<DomainEvent> {
	constructor(@Inject(DataSource) dataSource: DataSource) {
		super(DomainEvent, dataSource);
	}

	async saveEvent(event: DomainEvent): Promise<DomainEvent> {
		return await this.save(event);
	}
}
