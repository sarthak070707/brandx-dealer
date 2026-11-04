import { describe, expect, it } from "vitest";
import { buyerContact, indianMobile } from "./validation";

describe("indianMobile", () => {
  it("normalises common ways of typing a number", () => {
    for (const typed of ["9876543210", "+91 98765 43210", "098765-43210", "919876543210"]) {
      expect(indianMobile.parse(typed)).toBe("+919876543210");
    }
  });

  it("rejects numbers that are not Indian mobiles", () => {
    for (const typed of ["12345", "5876543210", "98765432101"]) {
      expect(indianMobile.safeParse(typed).success).toBe(false);
    }
  });
});

describe("buyerContact", () => {
  const valid = { buyerName: "Asha Rao", buyerPhone: "9876543210", language: "EN", consent: true };

  it("accepts complete contact details", () => {
    expect(buyerContact.safeParse(valid).success).toBe(true);
  });

  it("refuses details without consent", () => {
    expect(buyerContact.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("refuses a missing or one-letter name", () => {
    expect(buyerContact.safeParse({ ...valid, buyerName: "A" }).success).toBe(false);
  });
});
