import path from "node:path";
import dotenv from "dotenv";

interface ConfigOptions {
	nodeEnv: string;
	dbPort: number;
	dbUsername: string;
	dbPassword: string;
	dbName: string;
	saltRounds: number;
	logLevel: string;
	jwtSecret: string;
	emailUsername: string;
	emailPassword: string;
	emailSmtpServer: string;
	emailSmtpPort: number;
	emailSecure: boolean;
	emailImapServer: string;
	emailImapPort: number;
	emailFrom: string;
	awsAccessKeyId: string;
	awsSecretAccessKey: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Needed for Config class
export class Config {
	private static config: ConfigOptions;

	public static loadConfig(env: NodeJS.ProcessEnv = process.env) {
		console.info("Loading config...");
		dotenv.config({
			path: path.resolve(__dirname, `../../.env.${env.NODE_ENV}`),
		});
		Config.loadConfigInternal(env);
		Config.validateConfig();
		console.info("Config loaded");
	}

	private static loadConfigInternal(env: NodeJS.ProcessEnv): void {
		Config.config = {
			nodeEnv: Config.getValueOrDefault(env.NODE_ENV, "development"),
			dbPort: Config.getNumberValueOrDefault(env.DB_PORT, 5432),
			dbUsername: Config.getValueOrDefault(env.DB_USERNAME, ""),
			dbPassword: Config.getValueOrDefault(env.DB_PASSWORD, ""),
			dbName: Config.getValueOrDefault(env.DB_NAME, ""),
			saltRounds: Config.getNumberValueOrDefault(env.SALT_ROUNDS, 10),
			logLevel: Config.getValueOrDefault(env.LOG_LEVEL, ""),
			jwtSecret: Config.getValueOrDefault(env.JWT_SECRET, ""),
			emailUsername: Config.getValueOrDefault(env.EMAIL_USERNAME, ""),
			emailPassword: Config.getValueOrDefault(env.EMAIL_PASSWORD, ""),
			emailSmtpServer: Config.getValueOrDefault(env.EMAIL_SMTP_SERVER, ""),
			emailSmtpPort: Config.getNumberValueOrDefault(env.EMAIL_SMTP_PORT, 587),
			emailSecure: Config.getBooleanValueOrDefault(env.EMAIL_SECURE, false),
			emailImapServer: Config.getValueOrDefault(env.EMAIL_IMAP_SERVER, ""),
			emailImapPort: Config.getNumberValueOrDefault(env.EMAIL_IMAP_PORT, 993),
			emailFrom: Config.getValueOrDefault(env.EMAIL_FROM, ""),
			awsAccessKeyId: Config.getValueOrDefault(env.AWS_ACCESS_KEY_ID, ""),
			awsSecretAccessKey: Config.getValueOrDefault(
				env.AWS_SECRET_ACCESS_KEY,
				"",
			),
		};
	}

	private static getValueOrDefault(
		value: string | undefined,
		defaultValue: string,
	): string {
		return value || defaultValue;
	}

	private static getNumberValueOrDefault(
		value: string | undefined,
		defaultValue: number,
	): number {
		return value ? Number(value) : defaultValue;
	}

	private static getBooleanValueOrDefault(
		value: string | undefined,
		defaultValue: boolean,
	): boolean {
		return value ? value.toLowerCase() === "true" : defaultValue;
	}

	private static validateConfig(): void {
		for (const configKey of Object.keys(Config.getConfigValue)) {
			if (Config.getConfigValue(configKey) === "") {
				throw new Error(`Missing config value: ${configKey}`);
			}
		}
	}

	private static getConfigValue(key: string): string | number | boolean {
		return (Config as any)[key];
	}

	public static get nodeEnv(): string {
		return Config.config.nodeEnv;
	}

	public static get dbPort(): number {
		return Config.config.dbPort;
	}

	public static get dbUsername(): string {
		return Config.config.dbUsername;
	}

	public static get dbPassword(): string {
		return Config.config.dbPassword;
	}

	public static get dbName(): string {
		return Config.config.dbName;
	}

	public static get saltRounds(): number {
		return Config.config.saltRounds;
	}

	public static get logLevel(): string {
		return Config.config.logLevel;
	}

	public static get jwtSecret(): string {
		return Config.config.jwtSecret;
	}

	public static get emailUsername(): string {
		return Config.config.emailUsername;
	}

	public static get emailPassword(): string {
		return Config.config.emailPassword;
	}

	public static get emailSmtpServer(): string {
		return Config.config.emailSmtpServer;
	}

	public static get emailSmtpPort(): number {
		return Config.config.emailSmtpPort;
	}

	public static get emailImapServer(): string {
		return Config.config.emailImapServer;
	}

	public static get emailImapPort(): number {
		return Config.config.emailImapPort;
	}

	public static get emailSecure(): boolean {
		return Config.config.emailSecure;
	}

	public static get emailFrom(): string {
		return Config.config.emailFrom;
	}

	public static get awsAccessKeyId(): string {
		return Config.config.awsAccessKeyId;
	}

	public static get awsSecretAccessKey(): string {
		return Config.config.awsSecretAccessKey;
	}
}
