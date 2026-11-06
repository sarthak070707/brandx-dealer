import { db } from "@/lib/db";
import { readOptOutToken } from "@/lib/privacy/token";

// Stops messages to a buyer everywhere: every lead on that number is marked, so no later
// acknowledgement or reply can be sent to them (DPDP withdrawal of consent).
export async function optOutPhone(buyerPhone: string) {
  return db.$transaction(async (tx) => {
    const leads = await tx.lead.findMany({ where: { buyerPhone, optedOutAt: null }, select: { id: true } });
    if (leads.length === 0) return 0;

    await tx.lead.updateMany({ where: { id: { in: leads.map((lead) => lead.id) } }, data: { optedOutAt: new Date() } });
    await tx.leadEvent.createMany({
      data: leads.map((lead) => ({ leadId: lead.id, type: "NOTE" as const, details: { note: "Buyer opted out of messages" } })),
    });
    return leads.length;
  });
}

// The number an opt-out link was made for, or null if the link was altered or is unknown.
export async function phoneForOptOutToken(token: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  const leadId = secret ? readOptOutToken(token, secret) : null;
  if (!leadId) return null;
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { buyerPhone: true } });
  return lead?.buyerPhone ?? null;
}
