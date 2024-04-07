import jwt from "jsonwebtoken";
import type { UserRole } from "../../models";
import { UnauthorizedError } from "../../utils/errors";
import type { JwtPayload } from "../../utils/types";

export class Authenticator {
	private readonly secretKey: string;

	constructor(secretKey: string) {
		this.secretKey = secretKey;
	}

	authenticate(
		token: string,
		requiredRoles: UserRole[],
	): { user_id: number; role: UserRole } {
		try {
			const decoded = jwt.verify(token, this.secretKey) as JwtPayload;
			const { user_id, role } = decoded;

			if (requiredRoles.includes(role)) {
				return { user_id, role };
			}

			throw new UnauthorizedError("User does not have the required role.");
		} catch (error) {
			console.error("Authentication error:", error);
			throw new Error("Authentication failed");
		}
	}
}
