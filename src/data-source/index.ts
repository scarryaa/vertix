import { DataSource } from "typeorm";
import { Config } from "../config";
import { EventEntity } from "../entities/Event";

export class AppDataSource {
	private static instance: DataSource;

	private constructor() {}

	static getInstance(): DataSource {
		if (!AppDataSource.instance) {
			AppDataSource.instance = createAppDataSource();
		}

		return AppDataSource.instance;
	}
}

function createAppDataSource() {
	return new DataSource({
		type: "postgres",
		host: "localhost",
		port: Config.dbPort,
		username: Config.dbUsername,
		password: Config.dbPassword,
		database: Config.dbName,
		entities: [EventEntity],
		synchronize: true,
		logging: false,
	});
}
