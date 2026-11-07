import type { LeadSource } from "@/generated/prisma/enums";

// What the Car column of the inbox says about a lead. A trade-in that names no Brand X car says so,
// instead of reading like an enquiry about nothing.
export function carLabelOf(lead: {
  source: LeadSource;
  model: { name: string } | null;
  variant: { name: string } | null;
  usedCar: { stockId: string; variantName: string } | null;
}) {
  const name = [lead.model?.name, lead.usedCar?.variantName ?? lead.variant?.name].filter(Boolean).join(" ");
  if (!name) return lead.source === "TRADE_IN" ? "Trade-in" : "General enquiry";
  return lead.usedCar ? `${name} (${lead.usedCar.stockId})` : name;
}
