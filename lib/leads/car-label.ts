import type { LeadSource } from "@/generated/prisma/enums";

// What the Car column of the inbox says about a lead. A trade-in or a service visit that names no Brand X
// car says what it is, instead of reading like an enquiry about nothing.
const NO_CAR_LABEL: Partial<Record<LeadSource, string>> = { TRADE_IN: "Trade-in", SERVICE: "Service" };

export function carLabelOf(lead: {
  source: LeadSource;
  model: { name: string } | null;
  variant: { name: string } | null;
  usedCar: { stockId: string; variantName: string } | null;
}) {
  const name = [lead.model?.name, lead.usedCar?.variantName ?? lead.variant?.name].filter(Boolean).join(" ");
  if (!name) return NO_CAR_LABEL[lead.source] ?? "General enquiry";
  return lead.usedCar ? `${name} (${lead.usedCar.stockId})` : name;
}
