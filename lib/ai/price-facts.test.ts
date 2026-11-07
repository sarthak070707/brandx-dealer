import { describe, expect, it } from "vitest";
import type { OnRoadPrice } from "@/lib/pricing/on-road-price";
import type { VariantQuote } from "@/lib/pricing/quote";
import { variantPriceFacts } from "./price-facts";

const priced = (totalPaise: number): OnRoadPrice => ({
  available: true,
  exShowroomPaise: 0,
  roadTax: { paise: 0, rateBasisPoints: 0 },
  insurancePaise: 0,
  accessories: [],
  totalPaise,
  validUntil: new Date("2026-12-31T00:00:00Z"),
});
const missing: OnRoadPrice = { available: false, missing: ["INSURANCE"] };

describe("variantPriceFacts", () => {
  it("lists the price without accessories, each pack, and the price with each pack and with all of them", () => {
    const quote: VariantQuote = {
      withoutAccessories: priced(14_21_500_00),
      packs: [
        { name: "Urban pack", paise: 18_000_00, quote: priced(14_39_500_00) },
        { name: "Protection pack", paise: 9_500_00, quote: priced(14_31_000_00) },
      ],
      withAllPacks: priced(14_49_000_00),
    };
    expect(variantPriceFacts(quote, "Lucknow")).toEqual([
      { label: "on-road price in Lucknow, without accessories", paise: 14_21_500_00 },
      { label: "price of the Urban pack accessories pack", paise: 18_000_00 },
      { label: "on-road price in Lucknow, with the Urban pack", paise: 14_39_500_00 },
      { label: "price of the Protection pack accessories pack", paise: 9_500_00 },
      { label: "on-road price in Lucknow, with the Protection pack", paise: 14_31_000_00 },
      { label: "on-road price in Lucknow, with all 2 accessories packs", paise: 14_49_000_00 },
    ]);
  });

  it("offers no on-road figure for a city with no price, but still the packs' own prices", () => {
    const quote: VariantQuote = { withoutAccessories: missing, packs: [{ name: "Urban pack", paise: 18_000_00, quote: missing }], withAllPacks: null };
    expect(variantPriceFacts(quote, "Barabanki")).toEqual([{ label: "price of the Urban pack accessories pack", paise: 18_000_00 }]);
  });

  it("has nothing about accessories for a car with no packs", () => {
    expect(variantPriceFacts({ withoutAccessories: priced(10_00_000_00), packs: [], withAllPacks: null }, "Kanpur")).toEqual([
      { label: "on-road price in Kanpur, without accessories", paise: 10_00_000_00 },
    ]);
  });
});
