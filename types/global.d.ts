import type { Logger } from "../src/logger";

declare global {
	var $logger: Logger;
}

declare module "express" {
    interface Request {
        id?: string;
    }
}