import { toDraftView } from "@/lib/ai/view";
import { db } from "@/lib/db";
import { leadScope, type StaffUser } from "@/lib/leads/access";
import { describeEvent, referencedUserIds } from "@/lib/leads/events";
import type { InboxLead } from "@/lib/leads/inbox-filter";

const carLabelOf = (lead: {
  model: { name: string } | null;
  variant: { name: string } | null;
  usedCar: { stockId: string; variantName: string } | null;
}) => {
  const name = [lead.model?.name, lead.usedCar?.variantName ?? lead.variant?.name].filter(Boolean).join(" ");
  if (!name) return "General enquiry";
  return lead.usedCar ? `${name} (${lead.usedCar.stockId})` : name;
};

const CREATED_FROM = { ENQUIRY: "enquiry form", TEST_DRIVE: "test-drive booking" } as const;

export type InboxData = Awaited<ReturnType<typeof getInbox>>;

export async function getInbox(user: StaffUser) {
  const [leads, showrooms, consultants] = await Promise.all([
    db.lead.findMany({
      where: leadScope(user),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        buyerName: true,
        source: true,
        status: true,
        createdAt: true,
        firstContactAt: true,
        showroomId: true,
        assignedToId: true,
        showroom: { select: { name: true } },
        assignedTo: { select: { name: true } },
        model: { select: { name: true } },
        variant: { select: { name: true } },
        usedCar: { select: { stockId: true, variantName: true } },
      },
    }),
    db.showroom.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // Consultants only ever see their own leads, so only admins get a consultant filter.
    user.role === "ADMIN"
      ? db.user.findMany({ where: { role: "CONSULTANT" }, orderBy: { name: "asc" }, select: { id: true, name: true } })
      : [],
  ]);

  const rows: InboxLead[] = leads.map((lead) => ({
    id: lead.id,
    buyerName: lead.buyerName,
    source: lead.source,
    status: lead.status,
    createdAt: lead.createdAt,
    firstContactAt: lead.firstContactAt,
    showroomId: lead.showroomId,
    showroomName: lead.showroom.name,
    assignedToId: lead.assignedToId,
    consultantName: lead.assignedTo?.name ?? null,
    carLabel: carLabelOf(lead),
  }));
  // The server's clock at read time, so the browser's timers start from the same moment.
  return { leads: rows, showrooms, consultants, renderedAt: Date.now() };
}

export type LeadDetail = NonNullable<Awaited<ReturnType<typeof getLeadDetail>>>;

export async function getLeadDetail(user: StaffUser, id: string) {
  const lead = await db.lead.findFirst({
    where: { id, ...leadScope(user) },
    include: {
      model: { select: { name: true } },
      variant: { select: { name: true } },
      usedCar: { select: { stockId: true, variantName: true } },
      city: { select: { name: true } },
      showroom: { select: { name: true, address: true } },
      assignedTo: { select: { id: true, name: true } },
      booking: { select: { slotStart: true, status: true } },
      // The first message is the acknowledgement; later ones are replies.
      outbox: { orderBy: { createdAt: "asc" }, take: 1, select: { body: true, channel: true, createdAt: true } },
      aiDrafts: { orderBy: { createdAt: "desc" }, take: 1 },
      events: {
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, details: true, createdAt: true, actor: { select: { name: true } } },
      },
    },
  });
  if (!lead) return null;

  const people = await db.user.findMany({
    where: { id: { in: referencedUserIds(lead.events) } },
    select: { id: true, name: true },
  });
  const names = new Map(people.map((person) => [person.id, person.name]));

  const { events, outbox, aiDrafts, ...rest } = lead;
  return {
    ...rest,
    carLabel: carLabelOf(lead),
    acknowledgement: outbox[0] ?? null,
    aiDraft: aiDrafts[0] ? toDraftView(aiDrafts[0]) : null,
    renderedAt: Date.now(),
    timeline: [
      { id: "created", text: `Lead created from the ${CREATED_FROM[lead.source]}`, actorName: null, at: lead.createdAt },
      ...events.map((event) => ({
        id: event.id,
        text: describeEvent(event, names),
        actorName: event.actor?.name ?? null,
        at: event.createdAt,
      })),
    ],
  };
}

export async function getAssignableConsultants() {
  const consultants = await db.user.findMany({
    where: { role: "CONSULTANT", active: true },
    orderBy: [{ showroom: { name: "asc" } }, { name: "asc" }],
    select: { id: true, name: true, showroom: { select: { name: true } } },
  });
  return consultants.map((consultant) => ({
    id: consultant.id,
    label: `${consultant.name}, ${consultant.showroom?.name ?? "no showroom"}`,
  }));
}
