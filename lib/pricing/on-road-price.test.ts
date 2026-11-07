import { describe, expect, it } from "vitest";
import { computeOnRoadPrice, validOn, type PriceRequest, type PriceTables } from "./on-road-price";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const current = { validFrom: day("2026-10-01"), validTo: day("2026-12-31") };
const rupees = (amount: number) => amount * 100;
const TEN_LAKH = rupees(10_00_000);

// The spec's worked example: NEW-H-02, Model H ZX automatic, petrol, Lucknow.
function tables(overrides: Partial<PriceTables> = {}): PriceTables {
  return {
    variantPrices: [{ variantId: "h02", exShowroomPaise: rupees(12_45_000), ...current }],
    roadTaxRules: [
      { cityId: "lko", fuel: "PETROL", slabMinPaise: 0, slabMaxPaise: TEN_LAKH, rateBasisPoints: 800, ...current },
      { cityId: "lko", fuel: "PETROL", slabMinPaise: TEN_LAKH, slabMaxPaise: null, rateBasisPoints: 1000, ...current },
      { cityId: "lko", fuel: "DIESEL", slabMinPaise: TEN_LAKH, slabMaxPaise: null, rateBasisPoints: 1200, ...current },
      { cityId: "knp", fuel: "PETROL", slabMinPaise: TEN_LAKH, slabMaxPaise: null, rateBasisPoints: 1500, ...current },
    ],
    insuranceRates: [
      { variantId: "h02", cityId: "lko", premiumPaise: rupees(52_000), ...current },
      { variantId: "h02", cityId: "knp", premiumPaise: rupees(51_000), ...current },
    ],
    accessoryPackages: [{ modelId: "h", name: "Urban pack", pricePaise: rupees(18_000), ...current }],
    ...overrides,
  };
}

const request: PriceRequest = {
  variant: { id: "h02", modelId: "h", fuel: "PETROL" },
  cityId: "lko",
  date: day("2026-11-03"),
  includeAccessories: true,
};

function priced(result: ReturnType<typeof computeOnRoadPrice>) {
  if (!result.available) throw new Error(`expected a price, missing ${result.missing.join(", ")}`);
  return result;
}

describe("computeOnRoadPrice", () => {
  it("matches the spec's worked example line by line", () => {
    const price = priced(computeOnRoadPrice(tables(), request));
    expect(price.exShowroomPaise).toBe(rupees(12_45_000));
    expect(price.roadTax).toEqual({ paise: rupees(1_24_500), rateBasisPoints: 1000 });
    expect(price.insurancePaise).toBe(rupees(52_000));
    expect(price.accessories).toEqual({ name: "Urban pack", paise: rupees(18_000) });
    expect(price.totalPaise).toBe(rupees(14_39_500));
  });

  it("leaves accessories out unless the buyer ticks them", () => {
    const price = priced(computeOnRoadPrice(tables(), { ...request, includeAccessories: false }));
    expect(price.accessories).toBeNull();
    expect(price.totalPaise).toBe(rupees(14_21_500));
  });

  it("puts a price exactly on a slab boundary in the higher slab only", () => {
    const atBoundary = tables({ variantPrices: [{ variantId: "h02", exShowroomPaise: TEN_LAKH, ...current }] });
    expect(priced(computeOnRoadPrice(atBoundary, request)).roadTax.rateBasisPoints).toBe(1000);

    const justBelow = tables({ variantPrices: [{ variantId: "h02", exShowroomPaise: TEN_LAKH - 100, ...current }] });
    expect(priced(computeOnRoadPrice(justBelow, request)).roadTax.rateBasisPoints).toBe(800);
  });

  it("uses only the city and fuel the request asks for", () => {
    expect(priced(computeOnRoadPrice(tables(), { ...request, cityId: "knp" })).roadTax.rateBasisPoints).toBe(1500);
    expect(priced(computeOnRoadPrice(tables(), request)).roadTax.rateBasisPoints).toBe(1000);
  });

  it("rounds each line to the nearest rupee once, then sums", () => {
    const oddPrice = tables({ variantPrices: [{ variantId: "h02", exShowroomPaise: 12_345_678_90, ...current }] });
    const price = priced(computeOnRoadPrice(oddPrice, { ...request, includeAccessories: false }));
    expect(price.exShowroomPaise).toBe(12_345_679_00);
    expect(price.roadTax.paise).toBe(1_234_568_00);
    expect(price.totalPaise).toBe(price.exShowroomPaise + price.roadTax.paise + price.insurancePaise);
  });

  it("ignores expired rows and uses the version valid today", () => {
    const versioned = tables({
      variantPrices: [
        { variantId: "h02", exShowroomPaise: rupees(12_20_000), validFrom: day("2026-06-01"), validTo: day("2026-09-30") },
        { variantId: "h02", exShowroomPaise: rupees(12_45_000), ...current },
      ],
    });
    expect(priced(computeOnRoadPrice(versioned, request)).exShowroomPaise).toBe(rupees(12_45_000));
  });

  it("ignores a row that has not started yet, so an upcoming price never shows early", () => {
    const upcoming = tables({
      variantPrices: [
        { variantId: "h02", exShowroomPaise: rupees(12_45_000), ...current },
        { variantId: "h02", exShowroomPaise: rupees(13_00_000), validFrom: day("2027-01-01"), validTo: day("2027-03-31") },
      ],
    });
    expect(priced(computeOnRoadPrice(upcoming, request)).exShowroomPaise).toBe(rupees(12_45_000));
  });

  it("starts using a row on its first day, and not before", () => {
    const rows = [
      { ...current, value: 12 },
      { validFrom: day("2027-01-01"), validTo: day("2027-03-31"), value: 13 },
    ];
    expect(validOn(rows, day("2026-12-31"))?.value).toBe(12);
    expect(validOn(rows, day("2027-01-01"))?.value).toBe(13);
  });

  it("prefers the most recently started version when two overlap", () => {
    const overlapping = tables({
      variantPrices: [
        { variantId: "h02", exShowroomPaise: rupees(12_45_000), ...current },
        { variantId: "h02", exShowroomPaise: rupees(12_60_000), validFrom: day("2026-11-01"), validTo: day("2026-12-31") },
      ],
    });
    expect(priced(computeOnRoadPrice(overlapping, request)).exShowroomPaise).toBe(rupees(12_60_000));
  });

  it("counts validity dates as inclusive on both ends", () => {
    expect(computeOnRoadPrice(tables(), { ...request, date: day("2026-12-31") }).available).toBe(true);
    expect(computeOnRoadPrice(tables(), { ...request, date: day("2027-01-01") })).toEqual({
      available: false,
      missing: ["EX_SHOWROOM", "ROAD_TAX", "INSURANCE", "ACCESSORIES"],
    });
  });

  it("shows the earliest expiry among the rows it used", () => {
    const shortInsurance = tables({
      insuranceRates: [{ variantId: "h02", cityId: "lko", premiumPaise: rupees(52_000), validFrom: day("2026-10-01"), validTo: day("2026-11-30") }],
    });
    expect(priced(computeOnRoadPrice(shortInsurance, request)).validUntil).toEqual(day("2026-11-30"));
  });

  it("refuses a partial price when a required row is missing", () => {
    expect(computeOnRoadPrice(tables({ insuranceRates: [] }), request)).toEqual({
      available: false,
      missing: ["INSURANCE"],
    });
    expect(computeOnRoadPrice(tables(), { ...request, cityId: "bbk" })).toEqual({
      available: false,
      missing: ["ROAD_TAX", "INSURANCE"],
    });
    expect(computeOnRoadPrice(tables(), { ...request, variant: { ...request.variant, fuel: "CNG" } })).toEqual({
      available: false,
      missing: ["ROAD_TAX"],
    });
  });

  it("refuses a price when accessories are ticked but no package is valid", () => {
    expect(computeOnRoadPrice(tables({ accessoryPackages: [] }), request)).toEqual({
      available: false,
      missing: ["ACCESSORIES"],
    });
    expect(computeOnRoadPrice(tables({ accessoryPackages: [] }), { ...request, includeAccessories: false }).available).toBe(true);
  });
});

describe("validOn", () => {
  it("returns nothing when no row covers the date", () => {
    expect(validOn([{ ...current, value: 1 }], day("2027-02-01"))).toBeUndefined();
  });
});
