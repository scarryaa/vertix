import { $log } from "@tsed/common";
import { PlatformExpress } from "@tsed/platform-express";
import { AggregateRootFactory } from "./CQRS/aggregrate-roots/AggregateRootFactory";
import { UserAggregateRoot } from "./CQRS/aggregrate-roots/UserAggregateRoot";
import { Server } from "./Server";

async function bootstrap() {
	try {
		const platform = await PlatformExpress.bootstrap(Server);
		await platform.listen();

		// Rehydrate the aggregate roots
		registerAggregateRoots();

		process.on("SIGINT", () => {
			platform.stop();
		});
	} catch (error) {
		$log.error({
			event: "SERVER_BOOTSTRAP_ERROR",
			message: error.message,
			stack: error.stack,
		});
	}
}

const registerAggregateRoots = () => {
	AggregateRootFactory.registerAggregateRoot(
		"UserAggregateRoot",
		UserAggregateRoot,
	);
};

bootstrap();
