import { expect } from "chai";
import { SpectronClient } from "spectron";
import commonSetup from "./common-setup";

describe("ap-desktop App", function() {
  commonSetup.apply(this);

  let browser: any;
  let client: SpectronClient;

  beforeEach(function() {
    client = this.app.client;
    browser = client as any;
  });

  it("creates initial windows", async () => {
    const count = await client.getWindowCount();
    expect(count).to.equal(1);
  });
});
