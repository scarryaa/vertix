import { registerProvider } from "@tsed/di";
import { Logger } from "@tsed/logger";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { EventEntity } from "../entity/EventEntity";

// We need this here or else typeorm fails to grab env vars
config({
	path:
		process.env.NODE_ENV === "production"
			? ".env.production"
			: ".env.development",
});

export const PostgresDatasource = Symbol.for("PostgresDatasource");
export type PostgresDatasource = DataSource;
export const postgresDatasource = new DataSource({
	type: "postgres",
	entities: [EventEntity],
	host: "localhost",
	port: 5432,
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	schema: "public",
	synchronize: true,
	logging: false,
	migrations: [],
	subscribers: [],
});

registerProvider<DataSource>({
	provide: PostgresDatasource,
	type: "typeorm:datasource",
	deps: [Logger],
	async useAsyncFactory(logger: Logger) {
		await config();
		await postgresDatasource.initialize();

		logger.info("Connected with typeorm to database: Postgres");

		return postgresDatasource;
	},
	hooks: {
		$onDestroy(dataSource) {
			return dataSource.isInitialized && dataSource.destroy();
		},
	},
});
