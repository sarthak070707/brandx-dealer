import { describe, expect, it } from "vitest";
import { maskRegistration } from "./mask-registration";

describe("maskRegistration", () => {
  it("keeps the state and RTO code and the last two digits only", () => {
    expect(maskRegistration("UP32MN2741")).toBe("UP32 •• ••41");
  });

  it("accepts spaces and lower case", () => {
    expect(maskRegistration("up 78 hj 5530")).toBe("UP78 •• ••30");
  });

  it("handles short series and numbers", () => {
    expect(maskRegistration("DL3C45")).toBe("DL3 • 45");
  });

  it("hides anything it cannot parse instead of leaking it", () => {
    expect(maskRegistration("22BH1234AA")).toBe("Hidden until purchase");
    expect(maskRegistration("")).toBe("Hidden until purchase");
  });
});
