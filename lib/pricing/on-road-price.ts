import type { Fuel } from "@/generated/prisma/enums";

type Validity = { validFrom: Date; validTo: Date };

export type PriceTables = {
  variantPrices: (Validity & { variantId: string; exShowroomPaise: number })[];
  roadTaxRules: (Validity & {
    cityId: string;
    fuel: Fuel;
    slabMinPaise: number;
    slabMaxPaise: number | null;
    rateBasisPoints: number;
  })[];
  insuranceRates: (Validity & { variantId: string; cityId: string; premiumPaise: number })[];
  accessoryPackages: (Validity & { modelId: string; name: string; pricePaise: number })[];
};

export type PriceRequest = {
  variant: { id: string; modelId: string; fuel: Fuel };
  cityId: string;
  date: Date;
  // The names of the accessory packs the buyer has ticked; none is the price without accessories.
  packs: readonly string[];
};

export type MissingRow = "EX_SHOWROOM" | "ROAD_TAX" | "INSURANCE" | "ACCESSORIES";

export type OnRoadPrice =
  | {
      available: true;
      exShowroomPaise: number;
      roadTax: { paise: number; rateBasisPoints: number };
      insurancePaise: number;
      accessories: { name: string; paise: number }[];
      totalPaise: number;
      validUntil: Date;
    }
  | { available: false; missing: MissingRow[] };

export type AvailablePrice = Extract<OnRoadPrice, { available: true }>;

export const roundToRupee = (paise: number) => Math.round(paise / 100) * 100;

type PackRow = Validity & { name: string; pricePaise: number };
const packKey = (name: string) => name.trim().toLowerCase();

// When two versions overlap on a date, the most recently started one wins (A7).
export function validOn<T extends Validity>(rows: T[], date: Date): T | undefined {
  return rows
    .filter((row) => row.validFrom <= date && date <= row.validTo)
    .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0];
}

// The packs a buyer can add on a date: one row per pack name, the most recently started winning
// (A7), listed by name. Two different packs may run at the same time; two rows of the same pack
// may not, and the admin screen refuses that.
export function offeredPacks<T extends PackRow>(rows: T[], date: Date): T[] {
  const versions = new Map<string, T[]>();
  for (const row of rows) versions.set(packKey(row.name), [...(versions.get(packKey(row.name)) ?? []), row]);
  return [...versions.values()].flatMap((rowsOfOnePack) => validOn(rowsOfOnePack, date) ?? []).sort((a, b) => a.name.localeCompare(b.name));
}

export function computeOnRoadPrice(tables: PriceTables, request: PriceRequest): OnRoadPrice {
  const { variant, cityId, date } = request;

  const price = validOn(tables.variantPrices.filter((row) => row.variantId === variant.id), date);
  const insurance = validOn(
    tables.insuranceRates.filter((row) => row.variantId === variant.id && row.cityId === cityId),
    date,
  );
  const offered = offeredPacks(tables.accessoryPackages.filter((row) => row.modelId === variant.modelId), date);
  // Each ticked pack once, even if it is named twice.
  const ticked = [...new Set(request.packs.map(packKey))].map((key) => offered.find((pack) => packKey(pack.name) === key));
  // A4: half-open slab, min <= ex-showroom < max, so a boundary price matches exactly one slab.
  const taxRule =
    price &&
    validOn(
      tables.roadTaxRules.filter(
        (rule) =>
          rule.cityId === cityId &&
          rule.fuel === variant.fuel &&
          rule.slabMinPaise <= price.exShowroomPaise &&
          (rule.slabMaxPaise === null || price.exShowroomPaise < rule.slabMaxPaise),
      ),
      date,
    );

  const missing: MissingRow[] = [];
  if (!price) missing.push("EX_SHOWROOM");
  if (!taxRule) missing.push("ROAD_TAX");
  if (!insurance) missing.push("INSURANCE");
  if (ticked.some((pack) => !pack)) missing.push("ACCESSORIES");
  if (!price || !taxRule || !insurance || missing.length > 0) return { available: false, missing };

  const exShowroomPaise = roundToRupee(price.exShowroomPaise);
  const roadTaxPaise = roundToRupee((price.exShowroomPaise * taxRule.rateBasisPoints) / 10_000);
  const insurancePaise = roundToRupee(insurance.premiumPaise);
  const packRows = ticked.flatMap((pack) => pack ?? []);
  const accessories = packRows.map((pack) => ({ name: pack.name, paise: roundToRupee(pack.pricePaise) }));
  const accessoriesPaise = accessories.reduce((sum, pack) => sum + pack.paise, 0);
  const rowsUsed = [price, taxRule, insurance, ...packRows];

  return {
    available: true,
    exShowroomPaise,
    roadTax: { paise: roadTaxPaise, rateBasisPoints: taxRule.rateBasisPoints },
    insurancePaise,
    accessories,
    totalPaise: exShowroomPaise + roadTaxPaise + insurancePaise + accessoriesPaise,
    validUntil: new Date(Math.min(...rowsUsed.map((row) => row.validTo.getTime()))),
  };
}

export type OfferedPack = { name: string; paise: number; validTo: Date };

// The price of a variant with some packs added to its price without any. Accessories are a flat
// add-on, so this is exactly what computeOnRoadPrice gives for the same packs; the car page uses it
// so a buyer can tick any mix without a trip to the server.
export function withPacks(quote: AvailablePrice, packs: OfferedPack[]): AvailablePrice {
  return {
    ...quote,
    accessories: packs.map(({ name, paise }) => ({ name, paise })),
    totalPaise: quote.totalPaise + packs.reduce((sum, pack) => sum + pack.paise, 0),
    validUntil: new Date(Math.min(quote.validUntil.getTime(), ...packs.map((pack) => pack.validTo.getTime()))),
  };
}
