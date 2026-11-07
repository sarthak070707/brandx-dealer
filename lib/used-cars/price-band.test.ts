import { describe, expect, it } from "vitest";
import { compareToBand, pickReference, suggestPriceBand, type PriceBandInput } from "./price-band";

const rupees = (amount: number) => amount * 100;
const base: PriceBandInput = { newPricePaise: rupees(10_00_000), year: 2022, currentYear: 2026, km: 40_000, owners: 1, inspectionScore: 85 };

describe("suggestPriceBand", () => {
  it("works out a normal car: four years old, normal distance, one owner, normal inspection", () => {
    const band = suggestPriceBand(base);
    // 10,00,000 x (0.88 x 0.92^4 = 0.6303) = 6,30,300, rounded to the nearest 5,000
    expect(band.midPaise).toBe(rupees(6_30_000));
    expect(band.lowPaise).toBe(rupees(6_00_000));
    expect(band.highPaise).toBe(rupees(6_60_000));
  });

  it("always gives a low, middle and high in order, in steps of ₹5,000", () => {
    for (const year of [2026, 2024, 2020, 2012]) {
      for (const km of [3_000, 40_000, 150_000]) {
        const band = suggestPriceBand({ ...base, year, km });
        expect(band.lowPaise).toBeLessThanOrEqual(band.midPaise);
        expect(band.midPaise).toBeLessThanOrEqual(band.highPaise);
        for (const paise of [band.lowPaise, band.midPaise, band.highPaise]) expect(paise % rupees(5_000)).toBe(0);
      }
    }
  });

  it("is lower for an older car, more distance, more owners and a weaker inspection", () => {
    const mid = (change: Partial<PriceBandInput>) => suggestPriceBand({ ...base, ...change }).midPaise;
    expect(mid({ year: 2020 })).toBeLessThan(mid({ year: 2022 }));
    expect(mid({ km: 90_000 })).toBeLessThan(mid({ km: 40_000 }));
    expect(mid({ km: 15_000 })).toBeGreaterThan(mid({ km: 40_000 }));
    expect(mid({ owners: 2 })).toBeLessThan(mid({ owners: 1 }));
    expect(mid({ owners: 3 })).toBeLessThan(mid({ owners: 2 }));
    expect(mid({ inspectionScore: 70 })).toBeLessThan(mid({ inspectionScore: 85 }));
    expect(mid({ inspectionScore: 95 })).toBeGreaterThan(mid({ inspectionScore: 85 }));
  });

  it("never drops below 30% of the new price for age, and treats four or more owners as three", () => {
    const old = suggestPriceBand({ ...base, year: 1995, km: 100_000, inspectionScore: 85 });
    expect(old.midPaise).toBeGreaterThanOrEqual(rupees(2_80_000));
    expect(suggestPriceBand({ ...base, owners: 5 }).midPaise).toBe(suggestPriceBand({ ...base, owners: 3 }).midPaise);
  });

  it("caps what distance and inspection can do, so a strange number can't swing the price wildly", () => {
    const extreme = suggestPriceBand({ ...base, km: 900_000, inspectionScore: 0 }).midPaise;
    expect(extreme).toBeGreaterThan(suggestPriceBand(base).midPaise * 0.8);
  });

  it("explains each of the four factors in plain words", () => {
    const labels = suggestPriceBand({ ...base, owners: 2, km: 60_000, inspectionScore: 92 }).factors.map((factor) => factor.label);
    expect(labels).toEqual([
      "4 years old: keeps about 63% of the new price",
      "60,000 km against about 40,000 for its age: -8%",
      "2 owners: -4%",
      "Inspection score 92: +2%",
    ]);
  });

  it("copes with a car from this year or next, and says 1 year, not 1 years", () => {
    expect(suggestPriceBand({ ...base, year: 2026, km: 2_000 }).midPaise).toBeGreaterThan(suggestPriceBand(base).midPaise);
    expect(suggestPriceBand({ ...base, year: 2027, km: 2_000 }).factors[0].label).toBe("0 years old: keeps about 88% of the new price");
    expect(suggestPriceBand({ ...base, year: 2025 }).factors[0].label).toMatch(/^1 year old/);
  });
});

describe("compareToBand", () => {
  const band = suggestPriceBand(base);

  it("says below, within or above, with both ends counted as within", () => {
    expect(compareToBand(band.lowPaise - 1, band)).toBe("below");
    expect(compareToBand(band.lowPaise, band)).toBe("within");
    expect(compareToBand(band.midPaise, band)).toBe("within");
    expect(compareToBand(band.highPaise, band)).toBe("within");
    expect(compareToBand(band.highPaise + 1, band)).toBe("above");
  });
});

describe("pickReference", () => {
  const options = [
    { name: "VX", fuel: "PETROL", transmission: "MANUAL", paise: rupees(10_95_000) },
    { name: "ZX", fuel: "PETROL", transmission: "AUTOMATIC", paise: rupees(12_45_000) },
    { name: "ZX", fuel: "DIESEL", transmission: "AUTOMATIC", paise: rupees(13_80_000) },
  ];

  it("prefers the car's own new variant, matching fuel and gearbox as well as the name", () => {
    expect(pickReference(options, { variantName: "zx", fuel: "DIESEL", transmission: "AUTOMATIC" })).toEqual({ paise: rupees(13_80_000), basis: "exact" });
  });

  it("falls back to the cheapest new variant with the same fuel, then to the cheapest of all", () => {
    expect(pickReference(options, { variantName: "GT", fuel: "PETROL", transmission: "AUTOMATIC" })).toEqual({ paise: rupees(10_95_000), basis: "same-fuel" });
    expect(pickReference(options, { variantName: "GT", fuel: "CNG", transmission: "MANUAL" })).toEqual({ paise: rupees(10_95_000), basis: "cheapest" });
  });

  it("has no reference when the model has no current price", () => {
    expect(pickReference([], { variantName: "VX", fuel: "PETROL", transmission: "MANUAL" })).toBeNull();
  });
});
