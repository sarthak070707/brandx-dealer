import { z } from "zod";
import type { Complete } from "@/lib/ai/generate";
import { guardDraft } from "@/lib/ai/guard";
import type { ChatMessage } from "@/lib/ai/types";
import { wordCount } from "@/lib/ai/words";
import { formatRupees } from "@/lib/money";
import { compareToBand, type PriceBand } from "@/lib/used-cars/price-band";

export type BandExplanation = { text: string; source: "ai" | "template" };
export type BandFacts = { carName: string; band: PriceBand; newPricePaise: number; listedPaise: number | null };

const MAX_WORDS = 70;
const DEADLINE_MS = 8_000;
const outputSchema = z.object({ explanation: z.string().trim().min(1) });

const COMPARISON = {
  below: "is below this range, so it should sell quickly but may leave money on the table",
  within: "is inside this range",
  above: "is above this range, so expect it to take longer to sell",
} as const;

// The plain explanation used whenever the AI is unavailable or says something it shouldn't.
export function templateExplanation({ carName, band, listedPaise }: BandFacts) {
  const range = `The suggested range for the ${carName} is ${formatRupees(band.lowPaise)} to ${formatRupees(band.highPaise)}, with ${formatRupees(band.midPaise)} in the middle.`;
  const listed = listedPaise === null ? "" : ` The listed price of ${formatRupees(listedPaise)} ${COMPARISON[compareToBand(listedPaise, band)]}.`;
  return `${range}${listed} It follows the car's age, distance, owners and inspection score.`;
}

export function explanationMessages({ carName, band, newPricePaise, listedPaise }: BandFacts): ChatMessage[] {
  const facts = {
    car: carName,
    newPriceToday: formatRupees(newPricePaise),
    suggestedRange: { low: formatRupees(band.lowPaise), middle: formatRupees(band.midPaise), high: formatRupees(band.highPaise) },
    listedPrice: listedPaise === null ? null : formatRupees(listedPaise),
    listedPriceComparedWithRange: listedPaise === null ? null : compareToBand(listedPaise, band),
    whatMovedIt: band.factors.map((factor) => factor.label),
  };
  return [
    {
      role: "system",
      content:
        "You help a car dealership's admin understand a suggested price range for a used car. Use only the facts given. " +
        "In two or three short sentences, say what pushes the price up or down and how the listed price compares with the range. " +
        "Never write a rupee amount that is not in the facts, and say nothing about the market, demand or competitors. " +
        `Keep it under ${MAX_WORDS - 10} words. Reply with JSON only: {"explanation": "..."}.`,
    },
    { role: "user", content: JSON.stringify(facts) },
  ];
}

// The AI only explains a range that was already worked out. Its text must pass the same price guard as a
// reply to a buyer: it may repeat the given amounts and no others, and it must be short. Otherwise, or on
// any failure or delay, the standard explanation is used, so the admin always gets one.
export async function explainBand(facts: BandFacts, complete: Complete, deadlineMs = DEADLINE_MS): Promise<BandExplanation> {
  const fallback: BandExplanation = { text: templateExplanation(facts), source: "template" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deadlineMs);

  try {
    const parsed = outputSchema.safeParse(JSON.parse(await complete(explanationMessages(facts), controller.signal)));
    if (!parsed.success) return fallback;

    const allowed = [facts.band.lowPaise, facts.band.midPaise, facts.band.highPaise, facts.newPricePaise, ...(facts.listedPaise === null ? [] : [facts.listedPaise])];
    const guarded = guardDraft(parsed.data.explanation, allowed);
    if (guarded.removed.length > 0 || wordCount(guarded.text) > MAX_WORDS || guarded.text.trim() === "") return fallback;
    return { text: guarded.text, source: "ai" };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
