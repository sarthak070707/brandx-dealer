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
  includeAccessories: boolean;
};

export type MissingRow = "EX_SHOWROOM" | "ROAD_TAX" | "INSURANCE" | "ACCESSORIES";

export type OnRoadPrice =
  | {
      available: true;
      exShowroomPaise: number;
      roadTax: { paise: number; rateBasisPoints: number };
      insurancePaise: number;
      accessories: { name: string; paise: number } | null;
      totalPaise: number;
      validUntil: Date;
    }
  | { available: false; missing: MissingRow[] };

const roundToRupee = (paise: number) => Math.round(paise / 100) * 100;

// When two versions overlap on a date, the most recently started one wins (A7).
export function validOn<T extends Validity>(rows: T[], date: Date): T | undefined {
  return rows
    .filter((row) => row.validFrom <= date && date <= row.validTo)
    .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0];
}

export function computeOnRoadPrice(tables: PriceTables, request: PriceRequest): OnRoadPrice {
  const { variant, cityId, date, includeAccessories } = request;

  const price = validOn(tables.variantPrices.filter((row) => row.variantId === variant.id), date);
  const insurance = validOn(
    tables.insuranceRates.filter((row) => row.variantId === variant.id && row.cityId === cityId),
    date,
  );
  const accessories = includeAccessories
    ? validOn(tables.accessoryPackages.filter((row) => row.modelId === variant.modelId), date)
    : undefined;
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
  if (includeAccessories && !accessories) missing.push("ACCESSORIES");
  if (!price || !taxRule || !insurance || missing.length > 0) return { available: false, missing };

  const exShowroomPaise = roundToRupee(price.exShowroomPaise);
  const roadTaxPaise = roundToRupee((price.exShowroomPaise * taxRule.rateBasisPoints) / 10_000);
  const insurancePaise = roundToRupee(insurance.premiumPaise);
  const accessoriesPaise = accessories ? roundToRupee(accessories.pricePaise) : 0;
  const rowsUsed = [price, taxRule, insurance, ...(accessories ? [accessories] : [])];

  return {
    available: true,
    exShowroomPaise,
    roadTax: { paise: roadTaxPaise, rateBasisPoints: taxRule.rateBasisPoints },
    insurancePaise,
    accessories: accessories ? { name: accessories.name, paise: accessoriesPaise } : null,
    totalPaise: exShowroomPaise + roadTaxPaise + insurancePaise + accessoriesPaise,
    validUntil: new Date(Math.min(...rowsUsed.map((row) => row.validTo.getTime()))),
  };
}
