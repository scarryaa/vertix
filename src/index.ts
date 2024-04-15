import express from "express";
import "reflect-metadata";
import { Config } from "./config";
import { AppDataSource } from "./data-source";
import { Logger } from "./logger";
import { routes } from "./routes";
import { userRoutes } from "./routes/users";

class Vertix {
	async initialize(): Promise<void> {
		global.$logger = Logger.getInstance();
		Config.loadConfig();

		await AppDataSource.getInstance().initialize();
	}

	async run() {
		await this.initialize();

		const app = express();
		const port = 3000;

		app.use(routes);
		app.use("/users", userRoutes);
		app.listen(port, () => {
			$logger.info(`Server running on port ${port}`);
		});
	}
}

const vertix = new Vertix();
vertix.run();
