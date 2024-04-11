import { UserRole } from "../models";
import type { User } from "../services/user.service";

type SessionUser = Pick<User, "id" | "role" | "username" | "email" | "avatar">;

export class Session {
	private static instance: Session;
	private user: SessionUser | null = null;
	private auth_token: string | null = null;

	private constructor(user: User | null, auth_token: string | null) {
		this.user = user;
		this.auth_token = auth_token;
	}

	public getUser(): SessionUser | null {
		return this.user;
	}

	public getAuthToken(): string | null {
		return this.auth_token;
	}

	public isAdmin(): boolean {
		return Session.getInstance().user?.role === UserRole.ADMIN;
	}

	public static getInstance(): Session {
		if (!Session.instance) {
			Session.instance = new Session(null, null);
		}
		return Session.instance;
	}

	public static setUser(user: SessionUser | null): void {
		Session.getInstance().user = user;
	}

	public static setAuthToken(auth_token: string | null): void {
		Session.getInstance().auth_token = auth_token;
	}
}
