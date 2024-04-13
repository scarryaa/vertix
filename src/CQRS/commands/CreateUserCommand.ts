import type { UserRole } from "../../entity/User";

export class CreateUserCommand {
    public username: string;
    public email: string;
    public name: string;
    public password: string;
    public role: UserRole;

    constructor(username: string, email: string, name: string, password: string, role: UserRole) {
        this.username = username;
        this.email = email;
        this.name = name;
        this.password = password;
        this.role = role;
    }
}
