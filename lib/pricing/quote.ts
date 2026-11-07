import { indiaToday } from "@/lib/dates";
import { db } from "@/lib/db";
import { computeOnRoadPrice, offeredPacks, type OnRoadPrice } from "@/lib/pricing/on-road-price";

type QuotedVariant = { id: string; modelId: string; fuel: Parameters<typeof computeOnRoadPrice>[1]["variant"]["fuel"] };

export type VariantQuote = {
  withoutAccessories: OnRoadPrice;
  // Each pack on offer today: its own price, and the on-road price with just that pack.
  packs: { name: string; paise: number; quote: OnRoadPrice }[];
  // The on-road price with every pack, when there is more than one.
  withAllPacks: OnRoadPrice | null;
};

// The on-road price for one variant in one city today, without accessories and with each accessory
// pack, straight from the admin tables. Used where a price must never be guessed.
export async function quoteVariant(variant: QuotedVariant, cityId: string): Promise<VariantQuote> {
  const [prices, insuranceRates, roadTaxRules, accessoryPackages] = await Promise.all([
    db.variantPrice.findMany({ where: { variantId: variant.id } }),
    db.insuranceRate.findMany({ where: { variantId: variant.id, cityId } }),
    db.roadTaxRule.findMany({ where: { cityId, fuel: variant.fuel } }),
    db.accessoryPackage.findMany({ where: { modelId: variant.modelId } }),
  ]);
  const tables = { variantPrices: prices, insuranceRates, roadTaxRules, accessoryPackages };
  const date = indiaToday(new Date());
  const priceWith = (packs: string[]) => computeOnRoadPrice(tables, { variant, cityId, date, packs });

  const offered = offeredPacks(accessoryPackages, date);
  return {
    withoutAccessories: priceWith([]),
    packs: offered.map((pack) => ({ name: pack.name, paise: pack.pricePaise, quote: priceWith([pack.name]) })),
    withAllPacks: offered.length > 1 ? priceWith(offered.map((pack) => pack.name)) : null,
  };
}
