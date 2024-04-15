import { randomUUID } from "node:crypto";

export const generateUuid = (): string => {
	return randomUUID();
};
