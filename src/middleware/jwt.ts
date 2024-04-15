import type express from "express";
import { verify } from "jsonwebtoken";
import { Config } from "../config";

type JwtPayload = {
	id: string;
	username: string;
	iat: number;
	nbf: number;
};

export function jwtMiddleware(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction,
) {
	const auth = req.cookies.token;

	// Check if the token is valid
	if (auth && auth.iat > new Date().getTime() / 1000) {
		// The token is valid
		const decoded = verify(req.cookies.token, Config.jwtSecret) as JwtPayload;

		if (decoded) {
			req.id = decoded.id;
			return next();
		}

		// The token is not valid
		res.clearCookie("token");
		return res.status(401).send({ message: "Invalid credentials." });
	}

	// The token is not valid
	res.clearCookie("token");

	if (auth) {
		res.status(401).send({ message: "Invalid token provided." });
	} else {
		res.status(401).send({ message: "No token provided." });
	}
}
