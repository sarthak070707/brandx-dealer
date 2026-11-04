import type { Language, LeadSource } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { acknowledgement } from "@/lib/leads/acknowledgement";
import { pickConsultant } from "@/lib/leads/assign";
import { OPEN_STATUSES } from "@/lib/leads/status";

type NewLead = {
  source: LeadSource;
  buyerName: string;
  buyerPhone: string;
  language: Language;
  message?: string;
  modelId: string;
  variantId?: string;
  usedCarId?: string;
  cityId: string;
  showroomId: string;
  carLabel: string;
};

// Runs inside the caller's transaction, so a lead is never saved without its assignment,
// history and acknowledgement.
export async function createLead(tx: Prisma.TransactionClient, lead: NewLead) {
  const now = new Date();
  const [candidates, showroom] = await Promise.all([
    tx.user.findMany({
      where: {
        role: "CONSULTANT",
        active: true,
        showroomId: lead.showroomId,
        models: { some: { modelId: lead.modelId } },
      },
      select: {
        id: true,
        name: true,
        lastAssignedAt: true,
        _count: { select: { assignedLeads: { where: { status: { in: OPEN_STATUSES } } } } },
      },
    }),
    tx.showroom.findUniqueOrThrow({ where: { id: lead.showroomId }, select: { name: true } }),
  ]);

  const consultantId = pickConsultant(
    candidates.map((candidate) => ({
      id: candidate.id,
      openLeads: candidate._count.assignedLeads,
      lastAssignedAt: candidate.lastAssignedAt,
    })),
  );
  const consultant = candidates.find((candidate) => candidate.id === consultantId) ?? null;
  const { carLabel, ...fields } = lead;

  const created = await tx.lead.create({
    data: {
      ...fields,
      assignedToId: consultantId,
      consentAt: now,
      events: {
        create: [
          {
            type: "ASSIGNED",
            details: consultantId
              ? { reason: "auto", toUserId: consultantId }
              : { reason: "no-eligible-consultant", toUserId: null },
          },
          { type: "MESSAGE", details: { channel: "WHATSAPP", simulated: true } },
        ],
      },
      outbox: {
        create: {
          channel: "WHATSAPP",
          body: acknowledgement({
            language: lead.language,
            buyerName: lead.buyerName,
            carLabel,
            showroomName: showroom.name,
            consultantName: consultant?.name ?? null,
          }),
        },
      },
    },
  });

  if (consultantId) await tx.user.update({ where: { id: consultantId }, data: { lastAssignedAt: now } });
  return { lead: created, consultantName: consultant?.name ?? null, showroomName: showroom.name };
}
