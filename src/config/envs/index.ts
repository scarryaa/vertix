import * as dotenv from "dotenv";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

export const config = async () => await dotenv.config(
	process.env.NODE_ENV === "production"
		? { path: "./.env.production" }
		: { path: "./.env.development" },
);
export const isProduction = process.env.NODE_ENV === "production";
export const envs = process.env;
