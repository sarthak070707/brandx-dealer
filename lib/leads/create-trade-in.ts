import { z } from "zod";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads/create-lead";
import type { EnquiryResult } from "@/lib/leads/create-enquiry";
import { isRateLimited, RATE_LIMITED } from "@/lib/leads/rate-limit";
import { composeTradeInMessage, tradeInTopic } from "@/lib/leads/trade-in-message";
import { tradeInSchema, type TradeInInput } from "@/lib/leads/trade-in-schema";

// Same answer as an enquiry: who will call, from where, and whether a message went out.
export type TradeInResult = EnquiryResult;

const fieldProblem = (field: string, key: "showroom" | "checkFields"): TradeInResult => ({
  ok: false,
  error: "checkFields",
  fieldErrors: { [field]: [key] },
});

export async function createTradeIn(input: TradeInInput): Promise<TradeInResult> {
  const parsed = tradeInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "checkFields", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { buyerName, buyerPhone, language, yourCar, year, km, owners, condition, expectedPrice, notes, showroomId, modelId } = parsed.data;

  // The ids come from the browser, so they are only looked up here.
  const [showroom, model] = await Promise.all([
    db.showroom.findUnique({ where: { id: showroomId }, select: { id: true, cityId: true } }),
    modelId ? db.model.findUnique({ where: { id: modelId }, select: { id: true } }) : null,
  ]);
  if (!showroom) return fieldProblem("showroomId", "showroom");
  if (modelId && !model) return fieldProblem("modelId", "checkFields");
  if (await isRateLimited(buyerPhone)) return { ok: false, error: RATE_LIMITED };

  const { consultantName, showroomName, acknowledged } = await db.$transaction((tx) =>
    createLead(tx, {
      source: "TRADE_IN",
      buyerName,
      buyerPhone,
      language,
      message: composeTradeInMessage({ yourCar, year, km, owners, condition, expectedPaise: expectedPrice, notes }),
      modelId: model?.id,
      cityId: showroom.cityId,
      showroomId: showroom.id,
      carLabel: tradeInTopic(language, yourCar),
    }),
  );
  return { ok: true, consultantName, showroomName, acknowledged };
}
