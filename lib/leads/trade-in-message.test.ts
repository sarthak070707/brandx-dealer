import { describe, expect, it } from "vitest";
import { composeTradeInMessage, tradeInTopic } from "./trade-in-message";

const base = { yourCar: "Maruti Swift VXi", year: 2018, km: 62_000, owners: 2, condition: "GOOD" as const, expectedPaise: null, notes: null };

describe("composeTradeInMessage", () => {
  it("states the car, its year, distance, owners and condition in one line", () => {
    expect(composeTradeInMessage(base)).toBe("Trade-in: Maruti Swift VXi, 2018, 62,000 km, 2 owners, condition good.");
  });

  it("adds what the buyer hopes to get, and their notes, when given", () => {
    expect(composeTradeInMessage({ ...base, owners: 1, condition: "NEEDS_WORK", expectedPaise: 4_50_000_00, notes: "New tyres last month" })).toBe(
      "Trade-in: Maruti Swift VXi, 2018, 62,000 km, 1 owner, condition needs some work. Hopes to get ₹4,50,000. Notes: New tyres last month",
    );
  });
});

describe("tradeInTopic", () => {
  it("reads naturally in the acknowledgement in each language", () => {
    expect(tradeInTopic("EN", "Maruti Swift VXi")).toBe("trade-in of your Maruti Swift VXi");
    expect(tradeInTopic("HI", "Maruti Swift VXi")).toBe("आपकी Maruti Swift VXi के ट्रेड-इन");
  });
});
