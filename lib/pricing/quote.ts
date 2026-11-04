import { indiaToday } from "@/lib/dates";
import { db } from "@/lib/db";
import { computeOnRoadPrice, type OnRoadPrice } from "@/lib/pricing/on-road-price";

type QuotedVariant = { id: string; modelId: string; fuel: Parameters<typeof computeOnRoadPrice>[1]["variant"]["fuel"] };

// The on-road price for one variant in one city today, with and without the accessories
// package, straight from the admin tables. Used where a price must never be guessed.
export async function quoteVariant(variant: QuotedVariant, cityId: string): Promise<Record<"withAccessories" | "withoutAccessories", OnRoadPrice>> {
  const [prices, insuranceRates, roadTaxRules, accessoryPackages] = await Promise.all([
    db.variantPrice.findMany({ where: { variantId: variant.id } }),
    db.insuranceRate.findMany({ where: { variantId: variant.id, cityId } }),
    db.roadTaxRule.findMany({ where: { cityId, fuel: variant.fuel } }),
    db.accessoryPackage.findMany({ where: { modelId: variant.modelId } }),
  ]);
  const tables = { variantPrices: prices, insuranceRates, roadTaxRules, accessoryPackages };
  const request = { variant, cityId, date: indiaToday(new Date()) };

  return {
    withAccessories: computeOnRoadPrice(tables, { ...request, includeAccessories: true }),
    withoutAccessories: computeOnRoadPrice(tables, { ...request, includeAccessories: false }),
  };
}
