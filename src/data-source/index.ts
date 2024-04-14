import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { EventEntity } from "../entities/Event";

dotenv.config({
	path:
		process.env.NODE_ENV === "test"
			? "./.env.test"
			: process.env.NODE_ENV === "development"
				? "./.env.development"
				: "./.env.production",
});
export const AppDataSource = new DataSource({
	type: "postgres",
	host: "localhost",
	port: Number(process.env.DB_PORT),
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	entities: [EventEntity],
	synchronize: false,
	logging: false,
});
