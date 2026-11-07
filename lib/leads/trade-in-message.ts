import type { Language } from "@/generated/prisma/enums";
import { formatRupees } from "@/lib/money";

const CONDITION_TEXT = { GOOD: "good", FAIR: "fair", NEEDS_WORK: "needs some work" } as const;
const kmFormat = new Intl.NumberFormat("en-IN");

type TradeInDetails = {
  yourCar: string;
  year: number;
  km: number;
  owners: number;
  condition: keyof typeof CONDITION_TEXT;
  expectedPaise: number | null;
  notes: string | null;
};

// The lead's message, as the consultant reads it: one plain line about the car, in English because
// staff screens are in English whatever language the buyer uses.
export function composeTradeInMessage({ yourCar, year, km, owners, condition, expectedPaise, notes }: TradeInDetails) {
  return [
    `Trade-in: ${yourCar}, ${year}, ${kmFormat.format(km)} km, ${owners === 1 ? "1 owner" : `${owners} owners`}, condition ${CONDITION_TEXT[condition]}.`,
    expectedPaise !== null && `Hopes to get ${formatRupees(expectedPaise)}.`,
    notes && `Notes: ${notes}`,
  ]
    .filter(Boolean)
    .join(" ");
}

// Fills the "thanks for your interest in the ..." of the acknowledgement message.
export const tradeInTopic = (language: Language, yourCar: string) => (language === "HI" ? `आपकी ${yourCar} के ट्रेड-इन` : `trade-in of your ${yourCar}`);
