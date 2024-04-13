import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class EventEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	aggregateId: string;

	@Column()
	eventType: string;

	@Column("simple-json")
	payload: any;

	@CreateDateColumn()
	timestamp: Date;
}
