import type express from "express";
import { verify } from "jsonwebtoken";
import { createClient } from "redis";
import { Vertix } from "..";
import { Config } from "../config";
import { sendUnauthorizedResponse } from "../util/routes-util";

export type JwtPayload = {
	id: string;
	username: string;
	iat: number;
	nbf: number;
	jti: string;
};

export const jwtMiddleware = async (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction,
) => {
	try {
		const token = req.cookies.token;
		if (!token) {
			return sendUnauthorizedResponse(res);
		}

		const decoded = verify(token, Config.jwtSecret) as JwtPayload;
		const isRevoked = await isTokenRevoked(decoded.jti);
		if (isRevoked) {
			return sendUnauthorizedResponse(res);
		}

		req.id = decoded.id;
		next();
	} catch {
		return sendUnauthorizedResponse(res);
	}
};

export const revokeToken = async (token: string) => {
	if (!token) {
		$logger.error("No token to revoke");
		return;
	}

	const client = await createClient()
		.on("error", (err) => {
			console.error(err);
		})
		.connect();
	await client.del(token);
};

const isTokenRevoked = async (jti: string) => {
	const client = Vertix.getInstance().getRedisClient();
	const result = await client.get(jti);
	if (result) {
		return true;
	}

	return false;
};
