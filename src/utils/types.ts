import { ProgrammingLanguage, type UserRole } from "../models";

export type KeysOfType<T> = keyof {
	[K in keyof T as T[K] extends never ? never : K]: K;
};

export interface JwtPayload {
	user_id: string;
	role: UserRole;
}
