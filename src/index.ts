import dotenv from "dotenv";
import express from "express";
import "reflect-metadata";
import { config } from "./config";
import { AppDataSource } from "./data-source";
import { Logger } from "./logger";
import { routes } from "./routes";
import { userRoutes } from "./routes/users";

class Vertix {
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	async initialize(): Promise<void> {
		config();

		await AppDataSource.initialize();
	}

	async run() {
		await this.initialize();

		const app = express();
		const port = 3000;

		app.use(routes);
		app.use("/users", userRoutes);
		app.listen(port, () => {
			this.logger.info(`Server running on port ${port}`);
		});
	}
}

const logger = new Logger();
const vertix = new Vertix(logger);
vertix.run();
