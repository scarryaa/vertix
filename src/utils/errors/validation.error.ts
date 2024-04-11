import { BaseError } from "./base.error";

export class MissingPropertyError extends BaseError {
	constructor(
		paramName: string,
		serviceName: string,
		message = "Service %s: missing required property %s",
	) {
		super(
			message.replace("%s", serviceName).replace("%s", paramName),
			"MISSING_PROPERTY",
		);
	}
}
