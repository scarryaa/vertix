import path from "node:path";
import dotenv from "dotenv";

// biome-ignore lint/complexity/noStaticOnlyClass: Needed for Config class
export class Config {
	private static NODE_ENV: string = process.env.NODE_ENV || "development";
	private static DB_PORT: number;
	private static DB_USERNAME: string;
	private static DB_PASSWORD: string;
	private static DB_NAME: string;
	private static SALT_ROUNDS: number;
	private static LOG_LEVEL: string;

	public static loadConfig() {
		// Have to use console.info because logger config is not loaded yet
		console.info("Loading config...");
		console.debug(`NODE_ENV: ${Config.NODE_ENV}`);

		dotenv.config({
			path: path.resolve(__dirname, `../../.env.${Config.NODE_ENV}`),
		});
		Config.loadConfigInternal();
		Config.validateConfig();

		$logger.info("Config loaded");
	}

	private static loadConfigInternal(): void {
		Config.DB_PORT = Number(process.env.DB_PORT);
		Config.DB_USERNAME = process.env.DB_USERNAME || "";
		Config.DB_PASSWORD = process.env.DB_PASSWORD || "";
		Config.DB_NAME = process.env.DB_NAME || "";
		Config.SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
		Config.LOG_LEVEL = process.env.LOG_LEVEL || "";
	}

	private static validateConfig(): void {
		const requiredConfigs = [
			"DB_PORT",
			"DB_USERNAME",
			"DB_PASSWORD",
			"DB_NAME",
			"SALT_ROUNDS",
			"LOG_LEVEL",
		];
		for (const configKey of requiredConfigs) {
			const value = Config.getConfigValue(configKey);
			if (!value || value === "") {
				throw new Error(`${configKey} is not set`);
			}
		}
	}

	private static getConfigValue(key: string): string | number {
		switch (key) {
			case "DB_PORT":
				return Config.DB_PORT;
			case "DB_USERNAME":
				return Config.DB_USERNAME;
			case "DB_PASSWORD":
				return Config.DB_PASSWORD;
			case "DB_NAME":
				return Config.DB_NAME;
			case "SALT_ROUNDS":
				return Config.SALT_ROUNDS;
			case "LOG_LEVEL":
				return Config.LOG_LEVEL;
			default:
				return "";
		}
	}

	public static get dbPort(): number {
		return Config.DB_PORT;
	}

	public static get dbUsername(): string {
		return Config.DB_USERNAME;
	}

	public static get dbPassword(): string {
		return Config.DB_PASSWORD;
	}

	public static get dbName(): string {
		return Config.DB_NAME;
	}

	public static get saltRounds(): number {
		return Config.SALT_ROUNDS;
	}

	public static get logLevel(): string {
		return Config.LOG_LEVEL;
	}
}
