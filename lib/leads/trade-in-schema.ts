import { z } from "zod";
import { parseRupees } from "@/lib/admin/parse";
import { buyerContact, type FormInput } from "@/lib/validation";

export const TRADE_IN_CONDITIONS = ["GOOD", "FAIR", "NEEDS_WORK"] as const;
export const MAX_NOTES_LENGTH = 500;

// Every message is a key into the Errors messages, so each page shows it in its own language.
function whole(min: number, max: number, key: string) {
  return z.string().trim().regex(/^\d{1,7}$/, key).transform(Number).pipe(z.number().min(min, key).max(max, key));
}

export const tradeInSchema = buyerContact
  .extend({
    yourCar: z.string().trim().min(3, "yourCar").max(60, "yourCar"),
    year: whole(1990, 2100, "tradeYear"),
    km: whole(0, 999_999, "tradeKm"),
    owners: whole(1, 6, "tradeOwners"),
    condition: z.enum(TRADE_IN_CONDITIONS, "tradeCondition"),
    // What the buyer hopes to get; optional, and only ever shown to the consultant.
    expectedPrice: z
      .string()
      .trim()
      .transform((text) => (text === "" ? null : (parseRupees(text) ?? Number.NaN)))
      .pipe(z.number("tradePrice").positive("tradePrice").nullable()),
    notes: z
      .string()
      .trim()
      .max(MAX_NOTES_LENGTH, "messageTooLong")
      .transform((value) => value || null),
    showroomId: z.string().min(1, "showroom"),
    // A Brand X car they are considering; empty means they are not sure yet.
    modelId: z.string(),
  })
  .superRefine((tradeIn, context) => {
    if (tradeIn.year > new Date().getFullYear() + 1) context.addIssue({ code: "custom", path: ["year"], message: "tradeYear" });
  });

export type TradeInInput = FormInput<typeof tradeInSchema>;
