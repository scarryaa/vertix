import { PlatformTest } from "@tsed/common";
import SuperTest from "supertest";
import { Server } from "../../Server";
import { RootController } from "./RootController";

describe("RootController", () => {
  beforeEach(PlatformTest.bootstrap(Server, {
    mount: {
      "/": [RootController]
    }
  }));
  afterEach(PlatformTest.reset);

  it("should call GET /", async () => {
     const request = SuperTest(PlatformTest.callback());
     const response = await request.get("/").expect(200);

     expect(response.text).toEqual("This is the entrypoint for Vertix REST API.");
  });
});
