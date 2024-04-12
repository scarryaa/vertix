import { PlatformTest } from "@tsed/common";
import { PostgresDatasource } from "./PostgresDatasource";

describe("PostgresDatasource", () => {
	beforeEach(PlatformTest.create);
	afterEach(PlatformTest.reset);

	it("should do something", () => {
		const instance = PlatformTest.get<PostgresDatasource>(PostgresDatasource);
		// const instance = PlatformTest.invoke<PostgresDatasource>(PostgresDatasource); // get fresh instance

		expect(instance).toBeInstanceOf(PostgresDatasource);
	});
});
