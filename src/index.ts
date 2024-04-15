import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import "reflect-metadata";
import { Config } from "./config";
import { AppDataSource } from "./data-source";
import { Logger } from "./logger";
import { errorHandler } from "./middleware/errors";
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

		app.use(express.json());
		app.use(cors())
		app.use(cookieParser());
		app.use(routes);
		app.use("/users", userRoutes);
		userRoutes.use(errorHandler);

		app.listen(port, () => {
			$logger.info(`Server running on port ${port}`);
		});
	}
}

const vertix = new Vertix();
vertix.run();
