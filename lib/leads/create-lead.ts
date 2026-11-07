import type { Language, LeadSource } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { acknowledgement } from "@/lib/leads/acknowledgement";
import { pickConsultant } from "@/lib/leads/assign";
import { optOutLink } from "@/lib/privacy/opt-out-link";
import { OPEN_STATUSES } from "@/lib/leads/status";

type NewLead = {
  source: LeadSource;
  buyerName: string;
  buyerPhone: string;
  language: Language;
  message?: string;
  // A lead with no model (a trade-in that names no Brand X car) goes to any consultant at the showroom.
  modelId?: string;
  variantId?: string;
  usedCarId?: string;
  cityId: string;
  showroomId: string;
  carLabel: string;
  // For imported leads: hand the lead straight to this person instead of choosing, send no automatic
  // message, keep the date the buyer first asked, and record why in the history.
  assignToId?: string;
  sendAcknowledgement?: boolean;
  createdAt?: Date;
  note?: string;
};

// Runs inside the caller's transaction, so a lead is never saved without its assignment,
// history and acknowledgement. A buyer who opted out earlier stays opted out: no message is sent.
export async function createLead(tx: Prisma.TransactionClient, lead: NewLead) {
  const now = new Date();
  const [candidates, showroom, earlierOptOuts] = await Promise.all([
    tx.user.findMany({
      where: {
        role: "CONSULTANT",
        active: true,
        showroomId: lead.showroomId,
        ...(lead.modelId && { models: { some: { modelId: lead.modelId } } }),
      },
      select: {
        id: true,
        name: true,
        lastAssignedAt: true,
        _count: { select: { assignedLeads: { where: { status: { in: OPEN_STATUSES } } } } },
      },
    }),
    tx.showroom.findUniqueOrThrow({ where: { id: lead.showroomId }, select: { name: true } }),
    tx.lead.count({ where: { buyerPhone: lead.buyerPhone, optedOutAt: { not: null } } }),
  ]);
  const optedOut = earlierOptOuts > 0;

  const consultantId =
    lead.assignToId ??
    pickConsultant(
      candidates.map((candidate) => ({
        id: candidate.id,
        openLeads: candidate._count.assignedLeads,
        lastAssignedAt: candidate.lastAssignedAt,
      })),
    );
  const consultant = candidates.find((candidate) => candidate.id === consultantId) ?? null;
  const { carLabel, assignToId, sendAcknowledgement = true, note, createdAt, ...fields } = lead;
  const sendMessage = sendAcknowledgement && !optedOut;

  const assigned = {
    type: "ASSIGNED" as const,
    details: consultantId ? { reason: assignToId ? "importer" : "auto", toUserId: consultantId } : { reason: "no-eligible-consultant", toUserId: null },
  };
  const created = await tx.lead.create({
    data: {
      ...fields,
      assignedToId: consultantId,
      consentAt: now,
      optedOutAt: optedOut ? now : null,
      ...(createdAt && { createdAt }),
      events: {
        create: [
          assigned,
          ...(note ? [{ type: "NOTE" as const, details: { note } }] : []),
          ...(optedOut ? [{ type: "NOTE" as const, details: { note: "This buyer opted out of messages earlier, so no acknowledgement was sent" } }] : []),
        ],
      },
    },
  });

  if (sendMessage) {
    await tx.outboxMessage.create({
      data: {
        leadId: created.id,
        channel: "WHATSAPP",
        body: acknowledgement({
          language: lead.language,
          buyerName: lead.buyerName,
          carLabel,
          showroomName: showroom.name,
          consultantName: consultant?.name ?? null,
          optOutUrl: optOutLink(created.id, lead.language),
        }),
      },
    });
    await tx.leadEvent.create({ data: { leadId: created.id, type: "MESSAGE", details: { channel: "WHATSAPP", simulated: true } } });
  }

  if (consultantId) await tx.user.update({ where: { id: consultantId }, data: { lastAssignedAt: now } });
  return { lead: created, consultantName: consultant?.name ?? null, showroomName: showroom.name, acknowledged: sendMessage };
}
