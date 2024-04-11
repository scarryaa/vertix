import { promisify } from "node:util";
import { gzip } from "node:zlib";
import type { DomainEvent } from "../events/domain.event";

const gzipAsync = promisify(gzip);

export async function compressEvent(eventPayload: unknown): Promise<string> {
	try {
		const serializedEvent = JSON.stringify(eventPayload);
		const compressedEvent = await gzipAsync(serializedEvent);
		return compressedEvent.toString("base64");
	} catch (error) {
		// @TODO throw more specific error
		throw new Error("Event could not be compressed");
	}
}

export async function decompressEvent(
	compressedEvent: string,
): Promise<DomainEvent> {
	try {
		const serializedEvent = Buffer.from(compressedEvent, "base64");
		const decompressedEvent = await gzipAsync(serializedEvent);
		return JSON.parse(decompressedEvent.toString("utf8"));
	} catch (error) {
		// @TODO throw more specific error
		throw new Error("Event could not be decompressed");
	}
}
