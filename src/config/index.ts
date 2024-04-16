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
	private static JWT_SECRET: string;
	private static EMAIL_USERNAME: string;
	private static EMAIL_PASSWORD: string;
	private static EMAIL_SMTP_SERVER: string;
	private static EMAIL_SMTP_PORT: number;
	private static EMAIL_SECURE: boolean;
	private static EMAIL_IMAP_SERVER: string;
	private static EMAIL_IMAP_PORT: number;
	private static EMAIL_FROM: string;

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
		Config.JWT_SECRET = process.env.JWT_SECRET || "";

		// Email
		Config.EMAIL_USERNAME = process.env.EMAIL_USERNAME || "";
		Config.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
		Config.EMAIL_SMTP_SERVER = process.env.EMAIL_SMTP_SERVER || "";
		Config.EMAIL_SMTP_PORT = Number(process.env.EMAIL_SMTP_PORT) || 587;
		Config.EMAIL_IMAP_SERVER = process.env.EMAIL_IMAP_SERVER || "";
		Config.EMAIL_IMAP_PORT = Number(process.env.EMAIL_IMAP_PORT) || 993;
		Config.EMAIL_SECURE = Boolean(process.env.EMAIL_SECURE);
		Config.EMAIL_FROM = process.env.EMAIL_FROM || "";
	}

	private static validateConfig(): void {
		const requiredConfigs = [
			"DB_PORT",
			"DB_USERNAME",
			"DB_PASSWORD",
			"DB_NAME",
			"SALT_ROUNDS",
			"LOG_LEVEL",
			"JWT_SECRET",
			"EMAIL_USERNAME",
			"EMAIL_PASSWORD",
			"EMAIL_SMTP_SERVER",
			"EMAIL_SMTP_PORT",
			"EMAIL_IMAP_SERVER",
			"EMAIL_IMAP_PORT",
			"EMAIL_SECURE",
			"EMAIL_FROM",
		];
		for (const configKey of requiredConfigs) {
			const value = Config.getConfigValue(configKey);
			if (!value || value === "") {
				throw new Error(`${configKey} is not set`);
			}
		}
	}

	private static getConfigValue(key: string): string | number | boolean {
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
			case "JWT_SECRET":
				return Config.JWT_SECRET;
			case "EMAIL_USERNAME":
				return Config.EMAIL_USERNAME;
			case "EMAIL_PASSWORD":
				return Config.EMAIL_PASSWORD;
			case "EMAIL_SMTP_SERVER":
				return Config.EMAIL_SMTP_SERVER;
			case "EMAIL_SMTP_PORT":
				return Config.EMAIL_SMTP_PORT;
			case "EMAIL_IMAP_SERVER":
				return Config.EMAIL_IMAP_SERVER;
			case "EMAIL_IMAP_PORT":
				return Config.EMAIL_IMAP_PORT;
			case "EMAIL_SECURE":
				return Config.EMAIL_SECURE;
			case "EMAIL_FROM":
				return Config.EMAIL_FROM;
			default:
				return "";
		}
	}

	public static get nodeEnv(): string {
		return Config.NODE_ENV;
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

	public static get jwtSecret(): string {
		return Config.JWT_SECRET;
	}

	public static get emailUsername(): string {
		return Config.EMAIL_USERNAME;
	}

	public static get emailPassword(): string {
		return Config.EMAIL_PASSWORD;
	}

	public static get emailSmtpServer(): string {
		return Config.EMAIL_SMTP_SERVER;
	}

	public static get emailSmtpPort(): number {
		return Config.EMAIL_SMTP_PORT;
	}

	public static get emailImapServer(): string {
		return Config.EMAIL_IMAP_SERVER;
	}

	public static get emailImapPort(): number {
		return Config.EMAIL_IMAP_PORT;
	}

	public static get emailSecure(): boolean {
		return Config.EMAIL_SECURE;
	}

	public static get emailFrom(): string {
		return Config.EMAIL_FROM;
	}
}
