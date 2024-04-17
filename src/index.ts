import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { type RedisClientType, createClient } from "redis";
import "reflect-metadata";
import { Config } from "./config";
import { AppDataSource } from "./data-source";
import { EventStore } from "./events/store.event";
import { Logger } from "./logger";
import { errorHandler } from "./middleware/errors";
import { routes } from "./routes";
import { repositoryRoutes } from "./routes/repositories";
import { userRoutes } from "./routes/users";
import { MailService } from "./services/mail.service";
import { S3Service } from "./services/s3.service";
import { SnapshotService } from "./services/snapshot.service";
import { UserService } from "./services/user.service";

export class Vertix {
	private static instance: Vertix;
	private redisClient: RedisClientType;
	private userService: UserService;
	private eventStore: EventStore;
	private emailService: MailService;
	private snapshotService: SnapshotService;
	private s3Service: S3Service;

	private constructor() {
		// Redis client
		this.redisClient = createClient();
		this.redisClient.on("error", (err) => {
			console.error(err);
		});
		this.redisClient.connect();

		// Event store
		this.eventStore = EventStore.getInstance();

		// Other services
		UserService.initialize(this.eventStore);
		this.userService = UserService.getInstance();

		this.s3Service = S3Service.getInstance();
		this.snapshotService = SnapshotService.getInstance();
		this.snapshotService.configure(this.s3Service);

		this.emailService = new MailService();
	}

	async initialize(): Promise<void> {
		global.$logger = Logger.getInstance();
		Config.loadConfig();

		this.emailService.setUpTransporter();
		await AppDataSource.getInstance().initialize();
	}

	async run() {
		await this.initialize();

		const app = express();
		const port = 3000;
		const limiter = rateLimit({
			windowMs: 15 * 60 * 1000, // 15 minutes
			max: 100,
			standardHeaders: true,
			legacyHeaders: false,
		});

		app.use(limiter);
		app.use(helmet());
		app.use(express.json());
		app.use(cors());
		app.use(cookieParser());

		app.use(routes);
		app.use("/repositories", repositoryRoutes);
		app.use("/users", userRoutes);

		userRoutes.use(errorHandler);
		repositoryRoutes.use(errorHandler);

		app.listen(port, () => {
			$logger.info(`Server running on port ${port}`);
		});
	}

	static getInstance(): Vertix {
		if (!Vertix.instance) {
			Vertix.instance = new Vertix();
		}

		return Vertix.instance;
	}

	getEmailService(): MailService {
		return this.emailService;
	}

	getUserService(): UserService {
		return this.userService;
	}

	getRedisClient(): RedisClientType {
		return this.redisClient;
	}

	getSnapshotService(): SnapshotService {
		return this.snapshotService;
	}
}

const vertix = Vertix.getInstance();
vertix.run();
