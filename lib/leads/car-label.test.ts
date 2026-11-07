import { describe, expect, it } from "vitest";
import { carLabelOf } from "./car-label";

const none = { model: null, variant: null, usedCar: null };

describe("carLabelOf", () => {
  it("names the model and variant", () => {
    expect(carLabelOf({ source: "ENQUIRY", model: { name: "Model H" }, variant: { name: "ZX" }, usedCar: null })).toBe("Model H ZX");
  });

  it("names a used car with its stock number", () => {
    expect(carLabelOf({ source: "ENQUIRY", model: { name: "Model C" }, variant: null, usedCar: { stockId: "UC-1182", variantName: "VX" } })).toBe("Model C VX (UC-1182)");
  });

  it("calls a lead with no car a general enquiry, or a trade-in when that is what it is", () => {
    expect(carLabelOf({ source: "ENQUIRY", ...none })).toBe("General enquiry");
    expect(carLabelOf({ source: "TRADE_IN", ...none })).toBe("Trade-in");
  });

  it("shows the Brand X car a trade-in buyer is considering", () => {
    expect(carLabelOf({ source: "TRADE_IN", model: { name: "Model H" }, variant: null, usedCar: null })).toBe("Model H");
  });
});
