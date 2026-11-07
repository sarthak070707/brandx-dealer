"use server";

import { createTradeIn } from "@/lib/leads/create-trade-in";
import type { TradeInInput } from "@/lib/leads/trade-in-schema";

export async function submitTradeIn(input: TradeInInput) {
  return createTradeIn(input);
}
