import { z } from "zod";
import { Fuel, Transmission } from "@/generated/prisma/enums";
import { completeWithGroq } from "@/lib/ai/groq";
import type { Complete } from "@/lib/ai/generate";
import { wholeNumber } from "@/lib/admin/fields";
import { parseRupees } from "@/lib/admin/parse";
import { indiaToday } from "@/lib/dates";
import { db } from "@/lib/db";
import { validOn } from "@/lib/pricing/on-road-price";
import { compareToBand, pickReference, suggestPriceBand, type PriceBand, type Verdict } from "@/lib/used-cars/price-band";
import { explainBand, type BandExplanation } from "@/lib/used-cars/price-band-explain";

const inputSchema = z.object({
  modelId: z.string().min(1),
  variantName: z.string().trim().min(1),
  fuel: z.enum(Fuel),
  transmission: z.enum(Transmission),
  year: wholeNumber(2000, 2100),
  km: wholeNumber(0, 999_999),
  owners: wholeNumber(1, 6),
  score: wholeNumber(0, 100),
  // The price the admin has typed so far, if any, so the answer can say how it compares.
  price: z
    .string()
    .trim()
    .transform((text) => (text === "" ? null : (parseRupees(text) ?? Number.NaN)))
    .pipe(z.number().positive().nullable()),
});

export type PriceSuggestion =
  | { ok: true; band: PriceBand; verdict: Verdict | null; listedPaise: number | null; reference: { paise: number; label: string }; explanation: BandExplanation }
  | { ok: false; error: string };

const BASIS_LABEL = {
  exact: "the new price of this variant today",
  "same-fuel": "the cheapest new variant with the same fuel today",
  cheapest: "the cheapest new variant today",
} as const;

export async function suggestUsedCarPrice(input: unknown, complete: Complete = completeWithGroq): Promise<PriceSuggestion> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Fill in the car, year, distance driven, owners and inspection score first." };
  const car = parsed.data;

  const today = indiaToday(new Date());
  const model = await db.model.findUnique({
    where: { id: car.modelId },
    select: { name: true, variants: { select: { name: true, fuel: true, transmission: true, prices: true } } },
  });
  if (!model) return { ok: false, error: "Choose a car first." };

  const priced = model.variants.flatMap((variant) => {
    const price = validOn(variant.prices, today);
    return price ? [{ name: variant.name, fuel: variant.fuel, transmission: variant.transmission, paise: price.exShowroomPaise }] : [];
  });
  const reference = pickReference(priced, car);
  if (!reference) return { ok: false, error: "This car has no current new price, so there is nothing to measure against." };

  const band = suggestPriceBand({
    newPricePaise: reference.paise,
    year: car.year,
    currentYear: today.getUTCFullYear(),
    km: car.km,
    owners: car.owners,
    inspectionScore: car.score,
  });
  const explanation = await explainBand(
    { carName: `${model.name} ${car.variantName}`, band, newPricePaise: reference.paise, listedPaise: car.price },
    complete,
  );
  return {
    ok: true,
    band,
    verdict: car.price === null ? null : compareToBand(car.price, band),
    listedPaise: car.price,
    reference: { paise: reference.paise, label: BASIS_LABEL[reference.basis] },
    explanation,
  };
}
