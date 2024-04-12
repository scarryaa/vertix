import { Controller } from "@tsed/di";
import { Get } from "@tsed/schema";

@Controller("/")
export class RootController {
	@Get("/")
	get() {
		return "This is the entrypoint for the Vertix REST API.";
	}
}
