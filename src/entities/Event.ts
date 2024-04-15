import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class EventEntity<T> {
	@PrimaryColumn("uuid")
	id: string;

	@Column()
	eventType: string;

	@Column("jsonb")
	payload: any;

	@Column()
	aggregateId: string;

	@CreateDateColumn()
	createdAt!: Date;

	constructor(
		id: string,
		eventType: string,
		payload: any,
		aggregateId: string,
	) {
		this.id = id;
		this.eventType = eventType;
		this.payload = payload;
		this.aggregateId = aggregateId;
	}
}
