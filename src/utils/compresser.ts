import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

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

export async function decompressEvent(compressedEvent: string): Promise<any> {
	try {
		const serializedEvent = Buffer.from(compressedEvent, "base64");
		const decompressedEvent = await gunzipAsync(serializedEvent);
		console.log(decompressedEvent.toString("utf8"));
		return JSON.parse(decompressedEvent.toString("utf8"));
	} catch (error) {
		throw new Error("Event could not be decompressed");
	}
}
