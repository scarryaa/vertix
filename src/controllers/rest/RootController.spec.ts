import { PlatformTest } from "@tsed/common";
import { RootController } from "./RootController";

describe("RootController", () => {
  beforeEach(PlatformTest.create);
  afterEach(PlatformTest.reset);

  it("should do something", () => {
    const instance = PlatformTest.get<RootController>(RootController);
    // const instance = PlatformTest.invoke<RootController>(RootController); // get fresh instance

    expect(instance).toBeInstanceOf(RootController);
  });
});
