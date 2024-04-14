import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class EventEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column()
	eventType: string;

	@Column("simple-json")
	payload: string;

	@Column()
	aggregateId: string;

	@CreateDateColumn()
	createdAt!: Date;

	constructor(
		id: string,
		eventType: string,
		payload: string,
		aggregateId: string,
	) {
		this.id = id;
		this.eventType = eventType;
		this.payload = payload;
		this.aggregateId = aggregateId;
	}
}
