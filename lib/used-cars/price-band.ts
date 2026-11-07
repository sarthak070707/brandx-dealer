// A suggested price range for a used car, from a plain rule of thumb and today's new price. It is a
// guide for the admin, not market data: it knows nothing about demand, colour or local offers.
export type PriceBandInput = {
  newPricePaise: number;
  year: number;
  currentYear: number;
  km: number;
  owners: number;
  inspectionScore: number;
};

export type BandFactor = { key: "age" | "distance" | "owners" | "inspection"; label: string };
export type PriceBand = { lowPaise: number; midPaise: number; highPaise: number; factors: BandFactor[] };

// A used car keeps about 88% of the new price in its first year, then 92% of that for each year after.
const KEEPS_FIRST_YEAR = 0.88;
const KEEPS_EACH_YEAR_AFTER = 0.92;
const KEEPS_AT_LEAST = 0.3;
// About 10,000 km a year is normal; each 1,000 km beyond that costs 0.4%, and each 1,000 below earns it.
const NORMAL_KM_PER_YEAR = 10_000;
const PER_THOUSAND_KM = 0.004;
const OWNER_FACTOR = [1, 0.96, 0.92] as const;
// An inspection score of 85 is normal; each point above or below moves the price 0.3%.
const NORMAL_SCORE = 85;
const PER_SCORE_POINT = 0.003;
const BAND_HALF_WIDTH = 0.05;
const ROUND_TO_PAISE = 5_000 * 100;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const roundToStep = (paise: number) => Math.round(paise / ROUND_TO_PAISE) * ROUND_TO_PAISE;
const percent = (factor: number) => {
  const change = Math.round((factor - 1) * 100);
  return change === 0 ? "no change" : `${change > 0 ? "+" : "-"}${Math.abs(change)}%`;
};
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function suggestPriceBand({ newPricePaise, year, currentYear, km, owners, inspectionScore }: PriceBandInput): PriceBand {
  const age = Math.max(0, currentYear - year);
  const keeps = Math.max(KEEPS_AT_LEAST, KEEPS_FIRST_YEAR * KEEPS_EACH_YEAR_AFTER ** age);

  const normalKm = NORMAL_KM_PER_YEAR * Math.max(age, 0.5);
  const distance = clamp(1 - (PER_THOUSAND_KM * (km - normalKm)) / 1_000, 0.88, 1.06);
  const ownership = OWNER_FACTOR[Math.min(Math.max(owners, 1), OWNER_FACTOR.length) - 1];
  const inspection = clamp(1 + PER_SCORE_POINT * (inspectionScore - NORMAL_SCORE), 0.96, 1.04);

  const midPaise = roundToStep(newPricePaise * keeps * distance * ownership * inspection);
  return {
    lowPaise: roundToStep(midPaise * (1 - BAND_HALF_WIDTH)),
    midPaise,
    highPaise: roundToStep(midPaise * (1 + BAND_HALF_WIDTH)),
    factors: [
      { key: "age", label: `${plural(age, "year")} old: keeps about ${Math.round(keeps * 100)}% of the new price` },
      { key: "distance", label: `${new Intl.NumberFormat("en-IN").format(km)} km against about ${new Intl.NumberFormat("en-IN").format(normalKm)} for its age: ${percent(distance)}` },
      { key: "owners", label: `${plural(owners, "owner")}: ${percent(ownership)}` },
      { key: "inspection", label: `Inspection score ${inspectionScore}: ${percent(inspection)}` },
    ],
  };
}

export type Verdict = "below" | "within" | "above";

export const compareToBand = (listedPaise: number, band: PriceBand): Verdict =>
  listedPaise < band.lowPaise ? "below" : listedPaise > band.highPaise ? "above" : "within";

// Today's new price to measure a used car against: its own variant if there is one, otherwise the
// cheapest new variant with the same fuel, otherwise the cheapest new variant of the model.
type Priced = { name: string; fuel: string; transmission: string; paise: number };
export function pickReference(options: Priced[], car: { variantName: string; fuel: string; transmission: string }) {
  const cheapest = (list: Priced[]) => [...list].sort((a, b) => a.paise - b.paise)[0];
  const exact = options.find(
    (option) => option.name.toLowerCase() === car.variantName.toLowerCase() && option.fuel === car.fuel && option.transmission === car.transmission,
  );
  if (exact) return { paise: exact.paise, basis: "exact" as const };
  const sameFuel = cheapest(options.filter((option) => option.fuel === car.fuel));
  if (sameFuel) return { paise: sameFuel.paise, basis: "same-fuel" as const };
  const any = cheapest(options);
  return any ? { paise: any.paise, basis: "cheapest" as const } : null;
}
