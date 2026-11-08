import type { LeadSource, LeadStatus } from "@/generated/prisma/enums";
import { startOfIstDay } from "@/lib/dates";

export type InboxLead = {
  id: string;
  buyerName: string;
  source: LeadSource;
  status: LeadStatus;
  createdAt: Date;
  firstContactAt: Date | null;
  showroomId: string;
  showroomName: string;
  assignedToId: string | null;
  consultantName: string | null;
  carLabel: string;
  // Set when the buyer cancelled their test drive or service visit; the lead itself stays open.
  cancelledVisit: string | null;
};

export type CreatedWithin = "today" | "7d" | "30d";
export const UNASSIGNED = "unassigned";

export type InboxFilters = {
  statuses: LeadStatus[];
  sources: LeadSource[];
  showroomIds: string[];
  consultantIds: string[];
  created: CreatedWithin | null;
};

export const NO_INBOX_FILTERS: InboxFilters = { statuses: [], sources: [], showroomIds: [], consultantIds: [], created: null };

const DAY_MS = 24 * 60 * 60_000;
const WINDOW_DAYS = { "7d": 7, "30d": 30 } as const;

// An empty list means "any", so choosing nothing shows everything.
const allows = <T>(selected: T[], value: T) => selected.length === 0 || selected.includes(value);

function isRecentEnough(createdAt: Date, within: CreatedWithin | null, now: Date) {
  if (within === null) return true;
  if (within === "today") return createdAt >= startOfIstDay(now);
  return createdAt.getTime() >= now.getTime() - WINDOW_DAYS[within] * DAY_MS;
}

export function matchesInboxFilters(lead: InboxLead, filters: InboxFilters, now: Date) {
  return (
    allows(filters.statuses, lead.status) &&
    allows(filters.sources, lead.source) &&
    allows(filters.showroomIds, lead.showroomId) &&
    allows(filters.consultantIds, lead.assignedToId ?? UNASSIGNED) &&
    isRecentEnough(lead.createdAt, filters.created, now)
  );
}

const awaitingFirstContact = (lead: InboxLead) => lead.status === "NEW" && lead.firstContactAt === null;

// Leads still waiting for a first call come first, longest-waiting on top, since their
// timers matter most; everything else follows, newest first.
export function sortInbox(leads: InboxLead[]) {
  return leads.toSorted((a, b) => {
    if (awaitingFirstContact(a) !== awaitingFirstContact(b)) return awaitingFirstContact(a) ? -1 : 1;
    const oldestFirst = awaitingFirstContact(a);
    return oldestFirst ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export function inboxFilterCount(filters: InboxFilters) {
  return (
    filters.statuses.length +
    filters.sources.length +
    filters.showroomIds.length +
    filters.consultantIds.length +
    Number(filters.created !== null)
  );
}
