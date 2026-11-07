import { describe, expect, it } from "vitest";
import { computeOnRoadPrice, offeredPacks, validOn, withPacks, type OfferedPack, type PriceRequest, type PriceTables } from "./on-road-price";

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
  packs: ["Urban pack"],
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
    expect(price.accessories).toEqual([{ name: "Urban pack", paise: rupees(18_000) }]);
    expect(price.totalPaise).toBe(rupees(14_39_500));
  });

  it("leaves accessories out unless the buyer ticks them", () => {
    const price = priced(computeOnRoadPrice(tables(), { ...request, packs: [] }));
    expect(price.accessories).toEqual([]);
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
    const price = priced(computeOnRoadPrice(oddPrice, { ...request, packs: [] }));
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

  it("refuses a price when a pack is ticked but is not valid", () => {
    expect(computeOnRoadPrice(tables({ accessoryPackages: [] }), request)).toEqual({
      available: false,
      missing: ["ACCESSORIES"],
    });
    expect(computeOnRoadPrice(tables({ accessoryPackages: [] }), { ...request, packs: [] }).available).toBe(true);
  });
});

describe("validOn", () => {
  it("returns nothing when no row covers the date", () => {
    expect(validOn([{ ...current, value: 1 }], day("2027-02-01"))).toBeUndefined();
  });
});

describe("several accessory packs", () => {
  const urban = { modelId: "h", name: "Urban pack", pricePaise: rupees(18_000), ...current };
  const protection = { modelId: "h", name: "Protection pack", pricePaise: rupees(9_500), ...current };
  const two = () => tables({ accessoryPackages: [urban, protection] });

  it("adds each ticked pack as its own line and sums them, leaving the unticked out", () => {
    const both = priced(computeOnRoadPrice(two(), { ...request, packs: ["Urban pack", "Protection pack"] }));
    expect(both.accessories).toEqual([
      { name: "Urban pack", paise: rupees(18_000) },
      { name: "Protection pack", paise: rupees(9_500) },
    ]);
    expect(both.totalPaise).toBe(rupees(14_21_500 + 18_000 + 9_500));

    const only = priced(computeOnRoadPrice(two(), { ...request, packs: ["Protection pack"] }));
    expect(only.totalPaise).toBe(rupees(14_21_500 + 9_500));
  });

  it("matches a pack by name without caring about capitals or spaces, and counts a repeated name once", () => {
    const price = priced(computeOnRoadPrice(two(), { ...request, packs: [" urban PACK ", "Urban pack"] }));
    expect(price.accessories).toHaveLength(1);
    expect(price.totalPaise).toBe(rupees(14_39_500));
  });

  it("refuses the price if any ticked pack is not valid today, rather than leaving it out", () => {
    const expired = tables({ accessoryPackages: [urban, { ...protection, validFrom: day("2026-01-01"), validTo: day("2026-06-30") }] });
    expect(computeOnRoadPrice(expired, { ...request, packs: ["Urban pack", "Protection pack"] })).toEqual({ available: false, missing: ["ACCESSORIES"] });
  });

  it("only uses packs of the car's own model", () => {
    const other = tables({ accessoryPackages: [urban, { ...protection, modelId: "c" }] });
    expect(computeOnRoadPrice(other, { ...request, packs: ["Protection pack"] }).available).toBe(false);
  });

  it("shows the earliest expiry among everything used, including the packs", () => {
    const shortPack = tables({ accessoryPackages: [urban, { ...protection, validTo: day("2026-11-20") }] });
    expect(priced(computeOnRoadPrice(shortPack, { ...request, packs: ["Urban pack", "Protection pack"] })).validUntil).toEqual(day("2026-11-20"));
    expect(priced(computeOnRoadPrice(shortPack, { ...request, packs: ["Urban pack"] })).validUntil).toEqual(day("2026-12-31"));
  });
});

describe("offeredPacks", () => {
  const row = (name: string, from: string, to: string, pricePaise = rupees(1_000)) => ({ name, pricePaise, validFrom: day(from), validTo: day(to) });

  it("lists each pack once, by name, for packs valid on the date", () => {
    const rows = [row("Urban pack", "2026-10-01", "2026-12-31"), row("Comfort pack", "2026-10-01", "2026-12-31"), row("Winter pack", "2027-01-01", "2027-03-31")];
    expect(offeredPacks(rows, day("2026-11-03")).map((pack) => pack.name)).toEqual(["Comfort pack", "Urban pack"]);
  });

  it("takes the most recently started row of a pack when two versions overlap", () => {
    const rows = [row("Urban pack", "2026-10-01", "2026-12-31", rupees(18_000)), row("URBAN PACK", "2026-11-01", "2026-12-31", rupees(19_000))];
    const [pack] = offeredPacks(rows, day("2026-11-03"));
    expect(pack.pricePaise).toBe(rupees(19_000));
  });

  it("offers a pack from its first day and not before", () => {
    const rows = [row("Urban pack", "2026-10-01", "2026-12-31"), row("Urban pack", "2027-01-01", "2027-03-31", rupees(20_000))];
    expect(offeredPacks(rows, day("2026-12-31"))[0].pricePaise).toBe(rupees(1_000));
    expect(offeredPacks(rows, day("2027-01-01"))[0].pricePaise).toBe(rupees(20_000));
  });
});

describe("withPacks", () => {
  const urban = { modelId: "h", name: "Urban pack", pricePaise: rupees(18_000), ...current };
  const protection = { modelId: "h", name: "Protection pack", pricePaise: rupees(9_500), validFrom: current.validFrom, validTo: day("2026-11-20") };
  const comfort = { modelId: "h", name: "Comfort pack", pricePaise: rupees(7_250), ...current };
  const all = tables({ accessoryPackages: [urban, protection, comfort] });
  const base = priced(computeOnRoadPrice(all, { ...request, packs: [] }));
  const offered: OfferedPack[] = offeredPacks(all.accessoryPackages, request.date).map((pack) => ({ name: pack.name, paise: pack.pricePaise, validTo: pack.validTo }));

  it("gives exactly what the server gives for every mix of packs, so the page and the AI always agree", () => {
    for (let mask = 0; mask < 1 << offered.length; mask += 1) {
      const chosen = offered.filter((_, index) => mask & (1 << index));
      const onServer = priced(computeOnRoadPrice(all, { ...request, packs: chosen.map((pack) => pack.name) }));
      const onPage = withPacks(base, chosen);
      expect(onPage.totalPaise, `mix ${mask}`).toBe(onServer.totalPaise);
      expect(onPage.validUntil, `mix ${mask}`).toEqual(onServer.validUntil);
      expect(onPage.accessories.map((line) => line.name).toSorted(), `mix ${mask}`).toEqual(onServer.accessories.map((line) => line.name).toSorted());
    }
  });

  it("returns the price without accessories when nothing is ticked", () => {
    expect(withPacks(base, [])).toEqual(base);
  });
});
