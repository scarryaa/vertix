import { Controller } from "@tsed/di";
import { HeaderParams } from "@tsed/platform-params";
import { Delete, Get, Patch, Post, Put } from "@tsed/schema";

@Controller("/users")
export class UserController {
    @Get("/")
    get() {
        return "List of users";
    }

    @Get("/:userId")
    getById(@HeaderParams("userId") userId: string) {
        return "Specific user";
    }

    @Post("/:userId")
    create(@HeaderParams("userId") userId: string) {
        return "Created user";
    }

    @Put("/:userId")
    update(@HeaderParams("userId") userId: string) {
        return "Updated user";
    }

    @Patch("/:userId")
    patch(@HeaderParams("userId") userId: string) {
        return "Patched user";
    }

    @Delete("/:userId")
    delete(@HeaderParams("userId") userId: string) {
        return "Deleted user";
    }
}