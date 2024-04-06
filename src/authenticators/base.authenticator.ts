import jwt from "jsonwebtoken";

export class Authenticator {
	private readonly secretKey: string;

	constructor(secretKey: string) {
		this.secretKey = secretKey;
	}

	authenticate(token: string, requiredRoles: string[]): boolean {
		try {
			const decoded = jwt.verify(token, this.secretKey) as { role: string };
			if (requiredRoles.includes(decoded.role)) {
				// User has the required role
				return true;
			}

			console.error("User does not have the required role");
			return false;
		} catch (error) {
			console.error("Authentication error:", error);
			return false;
		}
	}
}
