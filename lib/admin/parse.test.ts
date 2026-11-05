import { describe, expect, it } from "vitest";
import {
  basisPointsToPercentText,
  dateField,
  dateToInputText,
  optionalRupeesField,
  paiseToRupeesText,
  parsePercent,
  parseRupees,
  positiveRupeesField,
  rupeesField,
} from "./parse";

describe("parseRupees", () => {
  it("turns whole rupees into paise, however they are typed", () => {
    expect(parseRupees("1245000")).toBe(124_500_000);
    expect(parseRupees("12,45,000")).toBe(124_500_000);
    expect(parseRupees("₹ 12,45,000")).toBe(124_500_000);
    expect(parseRupees("0")).toBe(0);
  });

  it("refuses decimals, negatives, words and empty text", () => {
    for (const text of ["12.5", "-100", "twelve", "", "1e5", "10 lakh"]) expect(parseRupees(text), text).toBeNull();
  });

  it("refuses an amount the 32-bit paise column could not hold", () => {
    expect(parseRupees("20000000")).toBe(2_000_000_000);
    expect(parseRupees("20000001")).toBeNull();
  });
});

describe("parsePercent", () => {
  it("turns a percentage into basis points", () => {
    expect(parsePercent("10")).toBe(1_000);
    expect(parsePercent("8.5")).toBe(850);
    expect(parsePercent("12.25%")).toBe(1_225);
    expect(parsePercent("100")).toBe(10_000);
  });

  it("refuses more than 100%, too many decimals, and non-numbers", () => {
    for (const text of ["100.5", "101", "8.555", "-5", "ten", ""]) expect(parsePercent(text), text).toBeNull();
  });
});

describe("text for inputs", () => {
  it("is the reverse of the parsers", () => {
    expect(paiseToRupeesText(parseRupees("1245000")!)).toBe("1245000");
    expect(basisPointsToPercentText(parsePercent("8.5")!)).toBe("8.5");
    expect(basisPointsToPercentText(parsePercent("10")!)).toBe("10");
    expect(dateToInputText(new Date("2026-12-31T00:00:00Z"))).toBe("2026-12-31");
  });
});

describe("form fields", () => {
  it("parse amounts and say what is wrong with a bad one", () => {
    expect(rupeesField.parse("52,000")).toBe(5_200_000);
    expect(rupeesField.safeParse("abc").error?.issues[0].message).toContain("whole number of rupees");
    expect(positiveRupeesField.safeParse("0").success).toBe(false);
    expect(positiveRupeesField.parse("1")).toBe(100);
  });

  it("treat a blank upper limit as no limit, but still reject nonsense", () => {
    expect(optionalRupeesField.parse("")).toBeNull();
    expect(optionalRupeesField.parse("10,00,000")).toBe(100_000_000);
    expect(optionalRupeesField.safeParse("lots").success).toBe(false);
  });

  it("read dates as midnight UTC and reject impossible days", () => {
    expect(dateField.parse("2026-12-31")).toEqual(new Date("2026-12-31T00:00:00Z"));
    expect(dateField.safeParse("2026-02-30").success).toBe(false);
    expect(dateField.safeParse("").success).toBe(false);
  });
});
