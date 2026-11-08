import { describe, expect, it } from "vitest";
import { findAmounts, guardDraft } from "./guard";

const ON_ROAD = 14_39_500_00;
const ON_ROAD_WITHOUT = 14_21_500_00;
const ALLOWED = [ON_ROAD, ON_ROAD_WITHOUT];
const paiseOf = (text: string) => findAmounts(text).map((amount) => amount.paise);

describe("findAmounts", () => {
  it("reads amounts written the ways buyers and models write them", () => {
    expect(paiseOf("₹14,39,500")).toEqual([ON_ROAD]);
    expect(paiseOf("Rs. 14,39,500")).toEqual([ON_ROAD]);
    expect(paiseOf("Rs 1439500")).toEqual([ON_ROAD]);
    expect(paiseOf("14,39,500 rupees")).toEqual([ON_ROAD]);
    expect(paiseOf("INR 14,39,500")).toEqual([ON_ROAD]);
    expect(paiseOf("₹14.395 lakh")).toEqual([ON_ROAD]);
    expect(paiseOf("14.4 lakh")).toEqual([14_40_000_00]);
    expect(paiseOf("1.2 crore")).toEqual([1_20_00_000_00]);
  });

  it("reads Hindi amounts", () => {
    expect(paiseOf("₹14,39,500 रुपये")).toEqual([ON_ROAD]);
    expect(paiseOf("14 लाख")).toEqual([14_00_000_00]);
  });

  it("catches a bare number of five digits or more as an amount", () => {
    expect(paiseOf("the price is 1439500 all in")).toEqual([ON_ROAD]);
  });

  it("ignores numbers that are not money", () => {
    expect(findAmounts("Model H ZX, 2026, UC-1182, 3:00 pm on 4 Nov, within 30 minutes")).toEqual([]);
    expect(findAmounts("It has done 41,200 km and 58,600 kms")).toEqual([]);
    expect(findAmounts("Call me on 9876543210")).toEqual([]);
  });

  it("does not take the full stop at the end of a sentence as part of the number", () => {
    expect(paiseOf("It costs ₹14,39,500.")).toEqual([ON_ROAD]);
  });
});

describe("guardDraft: amounts", () => {
  it("keeps a price that exactly matches the admin price", () => {
    const draft = "The on-road price in Lucknow is ₹14,39,500. Shall I book a test drive?";
    expect(guardDraft(draft, ALLOWED)).toEqual({ text: draft, removed: [] });
  });

  it("accepts the same price written another way", () => {
    expect(guardDraft("It is Rs. 14,21,500 on the road.", ALLOWED).removed).toEqual([]);
  });

  it("removes a price that does not match, including an approximate one", () => {
    const result = guardDraft("Hello. The on-road price is around ₹14.4 lakh. Shall we meet?", ALLOWED);
    expect(result.text).toBe("Hello. Shall we meet?");
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0]).toMatchObject({ kind: "amount", text: "The on-road price is around ₹14.4 lakh." });
    expect(result.removed[0].reason).toContain("not a price from the admin tables");
  });

  it("removes any amount at all when no price may be quoted", () => {
    const result = guardDraft("We have it for ₹14,39,500. Call us.", []);
    expect(result.text).toBe("Call us.");
  });

  it("removes a price the buyer might try to get quoted, such as one they suggested", () => {
    expect(guardDraft("Yes, I can do it for ₹10,00,000.", ALLOWED).removed).toHaveLength(1);
  });
});

describe("guardDraft: discounts and offers", () => {
  it("removes sentences about discounts, offers and percentages off, in English", () => {
    for (const sentence of [
      "We can give you a discount.",
      "There is a special offer this week.",
      "You get 10% off on the ZX.",
      "Enjoy 5 percent off today.",
      "Our festive deal ends soon.",
      "There is cashback on exchange.",
      "We have the best price in town.",
      "We will waive the fees.",
    ]) {
      const result = guardDraft(`Hello. ${sentence} Call us.`, ALLOWED);
      expect(result.removed, sentence).toHaveLength(1);
      expect(result.removed[0].kind).toBe("discount");
      expect(result.text).toBe("Hello. Call us.");
    }
  });

  it("removes sentences about discounts and offers in Hindi", () => {
    for (const sentence of ["आपको अच्छी छूट मिलेगी।", "हमारी नई स्कीम चल रही है।", "बड़ा डिस्काउंट उपलब्ध है।", "यह ऑफर आज तक है।"]) {
      const result = guardDraft(`नमस्ते। ${sentence} हमें कॉल करें।`, ALLOWED);
      expect(result.removed, sentence).toHaveLength(1);
      expect(result.text).toBe("नमस्ते। हमें कॉल करें।");
    }
  });

  it("leaves ordinary sentences alone, including a percentage that is not a discount", () => {
    const draft = "Hi Asha, thanks for writing. A 20% down payment is common. Shall I call you today?";
    expect(guardDraft(draft, ALLOWED)).toEqual({ text: draft, removed: [] });
  });

  it("returns nothing when every sentence is blocked", () => {
    const result = guardDraft("Special offer today. 50% off for you!", ALLOWED);
    expect(result.text).toBe("");
    expect(result.removed).toHaveLength(2);
  });

  it("keeps the original line breaks when nothing is removed", () => {
    const draft = "Hi Asha,\nThanks for writing.\nRohan, Brand X";
    expect(guardDraft(draft, ALLOWED).text).toBe(draft);
  });
});

describe("guardDraft: seat counts", () => {
  const SEVEN = { seats: 7 };

  it("keeps a seat count that matches the car's own data, in English and in Hindi", () => {
    for (const sentence of ["The Model V GX is a 7-seater.", "It has seven seats.", "Model V GX 7‑सीटर है।", "यह सात सीटर कार है।", "It seats 7 seats in three rows."]) {
      expect(guardDraft(sentence, [], SEVEN).removed, sentence).toEqual([]);
    }
  });

  it("removes a seat count that is not the car's, or any seat count when no variant is known", () => {
    const five = guardDraft("Hello. The ZX is a 7-seater. Call me.", [], { seats: 5 });
    expect(five.text).toBe("Hello. Call me.");
    expect(five.removed).toEqual([{ kind: "claim", text: "The ZX is a 7-seater.", reason: "it states a seat count that is not the 5 seats in the data" }]);

    const unknown = guardDraft("Model V GX 7-सीटर ऑटोमैटिक है।", []);
    expect(unknown.removed).toMatchObject([{ kind: "claim", reason: "it states a seat count, which is not in the data" }]);
  });

  it("keeps a sentence that mentions the buyer's wish and then the car's real seats", () => {
    expect(guardDraft("You asked for a 7-seater, but the GX is a 5-seater.", [], { seats: 5 }).removed).toEqual([]);
  });

  it("does not take other numbers near the word for seats as a seat count", () => {
    for (const sentence of ["The booking is for 12 seats at the event.", "Seat 7 days a week.", "We open 7 days.", "Call 9876543210 about the seat."]) {
      expect(guardDraft(sentence, [], null).removed, sentence).toEqual([]);
    }
  });
});

describe("guardDraft: a price nobody asked for", () => {
  it("says so in the reason when no price was asked for, and still removes only the sentences with amounts", () => {
    const result = guardDraft("Hello. The on-road price is ₹14,39,500. The consultant will confirm delivery.", [], null, { priceNotAsked: true });
    expect(result.text).toBe("Hello. The consultant will confirm delivery.");
    expect(result.removed).toEqual([{ kind: "amount", text: "The on-road price is ₹14,39,500.", reason: "it quotes 14,39,500, but the buyer did not ask about price" }]);
  });
});
