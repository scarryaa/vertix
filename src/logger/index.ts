import { Config } from "../config";

type Message = string | object | unknown;
enum LogLevel {
	Debug = 1,
	Info = 2,
	Warn = 3,
	Error = 4,
}

const logLevelToString = (level: LogLevel) => {
	switch (level) {
		case LogLevel.Debug:
			return "debug";
		case LogLevel.Info:
			return "info";
		case LogLevel.Warn:
			return "warn";
		case LogLevel.Error:
			return "error";
		default:
			return "unknown";
	}
};

const logLevelToNumber = (level: string) => {
	switch (level.toLowerCase()) {
		case "debug":
			return LogLevel.Debug;
		case "info":
			return LogLevel.Info;
		case "warn":
			return LogLevel.Warn;
		case "error":
			return LogLevel.Error;
		default:
			return LogLevel.Info;
	}
};

const colorCodes: Record<LogLevel, string> = {
	[LogLevel.Debug]: "\x1b[36m",
	[LogLevel.Info]: "\x1b[32m",
	[LogLevel.Warn]: "\x1b[33m",
	[LogLevel.Error]: "\x1b[31m",
};

export class Logger {
	private static $logger: Logger;
	private printedWarning = false;
	private twentyFourHourFormat: boolean;

	private constructor(twentyFourHourFormat = true) {
		this.twentyFourHourFormat = twentyFourHourFormat;
	}

	error(message: Message, ...args: Message[]) {
		this.handleMessage(LogLevel.Info, message, console.error, ...args);
	}

	warn(message: Message, ...args: Message[]) {
		this.handleMessage(LogLevel.Info, message, console.warn, ...args);
	}

	info(message: Message, ...args: Message[]) {
		this.handleMessage(LogLevel.Info, message, console.info, ...args);
	}

	debug(message: Message, ...args: Message[]) {
		this.handleMessage(LogLevel.Debug, message, console.debug, ...args);
	}

	private handleMessage(
		level: LogLevel,
		message: Message,
		callback: (message: string) => void,
		...args: Message[]
	) {
		if (this.shouldLog(level)) {
			// Combine the primary message with additional arguments
			const fullMessage = [message, ...args]
				.map((m) => {
					return typeof m === "object" ? this.formatJson(m) : String(m);
				})
				.join(" ");

			callback(this.formatMessage(level, fullMessage));
		}
	}

	private formatJson(message: Message): string {
		if (message === null) {
			return "null";
		}
		if (
			typeof message === "object" &&
			Object.keys(message as object).length === 0
		) {
			return "{}";
		}
		if (Array.isArray(message) && message.length === 0) {
			return "[]";
		}
		if (typeof message === "object") {
			return JSON.stringify(message, null, 2);
		}
		return String(message);
	}

	private formatTimestamp(): string {
		const date = new Date();
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		const seconds = date.getSeconds().toString().padStart(2, "0");

		if (this.twentyFourHourFormat) {
			return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
		}

		const hour12 = date.getHours() % 12 || 12;
		const amPm = date.getHours() < 12 ? "AM" : "PM";
		return `${month}/${day}/${year} ${hour12
			.toString()
			.padStart(2, "0")}:${minutes}:${seconds} ${amPm}`;
	}

	private formatMessage(
		logLevel: LogLevel,
		message: Message | Message[],
		structured = false,
	): string {
		if (!message) {
			return "";
		}
		let formattedMessage = "";
		if (Array.isArray(message)) {
			return message
				.map((m) => this.formatMessage(logLevel, m, structured))
				.join("\n");
		}
		formattedMessage = this.formatJson(message);
		const color = colorCodes[logLevel];
		const noColor = "\x1b[0m";
		const timestamp = this.formatTimestamp();

		// Apply color only to the log level, not to the timestamp
		return `${timestamp} ${color}${logLevelToString(
			logLevel,
		).toUpperCase()}: ${formattedMessage}${noColor}`;
	}

	private shouldLog(logLevel: LogLevel): boolean {
		// Default to "info" if not set and issue a warning
		if (!(Config.logLevel || this.printedWarning)) {
			console.warn(
				`${this.formatMessage(
					LogLevel.Warn,
					"LOG_LEVEL not set, defaulting to info",
				)}`,
			);
			this.printedWarning = true;
		}

		const envLogLevel = Config.logLevel || "info";
		const logLevelNumber = logLevelToNumber(envLogLevel);
		return logLevelNumber <= logLevel;
	}

	static getInstance(twentyFourHourFormat = true): Logger {
		if (!Logger.$logger) {
			Logger.$logger = new Logger(twentyFourHourFormat);
		}

		Logger.$logger.twentyFourHourFormat = twentyFourHourFormat;
		return Logger.$logger;
	}
}
