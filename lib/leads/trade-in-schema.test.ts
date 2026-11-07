import { describe, expect, it } from "vitest";
import { tradeInSchema } from "./trade-in-schema";

const valid = {
  buyerName: "Kiran Mehta",
  buyerPhone: "98765 43210",
  language: "EN",
  consent: true,
  yourCar: "Maruti Swift VXi",
  year: "2018",
  km: "62000",
  owners: "2",
  condition: "GOOD",
  expectedPrice: "4,50,000",
  notes: "",
  showroomId: "s1",
  modelId: "",
};
const keysFor = (input: unknown) => {
  const result = tradeInSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
};

describe("tradeInSchema", () => {
  it("accepts a complete trade-in and turns the text into numbers, paise and nothing for empty notes", () => {
    expect(tradeInSchema.parse(valid)).toMatchObject({ buyerPhone: "+919876543210", year: 2018, km: 62_000, owners: 2, expectedPrice: 45_000_000, notes: null, modelId: "" });
  });

  it("does not need an expected price", () => {
    expect(tradeInSchema.parse({ ...valid, expectedPrice: "  " }).expectedPrice).toBeNull();
  });

  it("gives a key for each problem, so the page can show it in the buyer's language", () => {
    expect(
      keysFor({ ...valid, buyerName: "K", buyerPhone: "123", consent: false, yourCar: "", year: "1980", km: "lots", owners: "0", condition: "OK", expectedPrice: "abc", showroomId: "" }),
    ).toEqual({
      buyerName: "name",
      buyerPhone: "phone",
      consent: "consent",
      yourCar: "yourCar",
      year: "tradeYear",
      km: "tradeKm",
      owners: "tradeOwners",
      condition: "tradeCondition",
      expectedPrice: "tradePrice",
      showroomId: "showroom",
    });
  });

  it("refuses a model year more than a year ahead, and a price of zero", () => {
    const thisYear = new Date().getFullYear();
    expect(keysFor({ ...valid, year: String(thisYear + 1) })).toEqual({});
    expect(keysFor({ ...valid, year: String(thisYear + 2) })).toEqual({ year: "tradeYear" });
    expect(keysFor({ ...valid, expectedPrice: "0" })).toEqual({ expectedPrice: "tradePrice" });
  });

  it("limits the notes, as it does for an enquiry", () => {
    expect(keysFor({ ...valid, notes: "x".repeat(501) })).toEqual({ notes: "messageTooLong" });
  });
});
