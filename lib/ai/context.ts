import { formatSlot } from "@/lib/dates";
import { db } from "@/lib/db";
import { leadScope, type StaffUser } from "@/lib/leads/access";
import { z } from "zod";
import { variantPriceFacts } from "@/lib/ai/price-facts";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";
import { quoteVariant } from "@/lib/pricing/quote";
import type { AiLeadFacts, DraftNames, PriceFact } from "@/lib/ai/types";

// Reads a lead the way the staff member is allowed to (spec: access is enforced in every
// query) and reduces it to the facts the AI may see.
export async function loadAssistContext(staff: StaffUser, leadId: string) {
  const lead = await db.lead.findFirst({
    where: { id: leadId, ...leadScope(staff) },
    select: {
      source: true,
      language: true,
      message: true,
      buyerName: true,
      cityId: true,
      city: { select: { name: true } },
      model: { select: { name: true } },
      variant: { select: { id: true, name: true, fuel: true, transmission: true, specs: true, modelId: true } },
      usedCar: { select: { stockId: true, variantName: true, year: true, km: true, pricePaise: true } },
      showroom: { select: { name: true } },
      assignedTo: { select: { name: true } },
      booking: { select: { slotStart: true, status: true } },
    },
  });
  if (!lead) return null;

  const prices: PriceFact[] = [];
  if (lead.variant) {
    prices.push(...variantPriceFacts(await quoteVariant(lead.variant, lead.cityId), lead.city.name));
  }
  if (lead.usedCar) prices.push({ label: `listed price of ${lead.usedCar.stockId}`, paise: lead.usedCar.pricePaise });

  const seats = z.object({ seats: z.number() }).safeParse(lead.variant?.specs);
  const specs =
    lead.variant && seats.success
      ? { seats: seats.data.seats, gearbox: TRANSMISSION_LABEL[lead.variant.transmission].toLowerCase(), fuel: FUEL_LABEL[lead.variant.fuel].toLowerCase() }
      : null;

  const facts: AiLeadFacts = {
    source: lead.source,
    language: lead.language,
    city: lead.city.name,
    message: lead.message,
    model: lead.model?.name ?? null,
    variant: lead.variant?.name ?? lead.usedCar?.variantName ?? null,
    specs,
    usedCar: lead.usedCar
      ? { label: `${lead.model?.name ?? "Used car"} ${lead.usedCar.variantName} (${lead.usedCar.stockId})`, year: lead.usedCar.year, km: lead.usedCar.km }
      : null,
    testDrive:
      lead.booking?.status === "CONFIRMED" ? { when: formatSlot(lead.booking.slotStart), showroom: lead.showroom.name } : null,
    prices,
  };
  const names: DraftNames = { name: lead.buyerName, consultant: lead.assignedTo?.name ?? null, showroom: lead.showroom.name };
  return { facts, names };
}
