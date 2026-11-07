import type { LeadStatus } from "@/generated/prisma/enums";
import { OPEN_STATUSES } from "@/lib/leads/status";

type Row = { assignedToId: string | null; status: LeadStatus; _count: { _all: number } };
export type LeadCount = { total: number; open: number };

// Leads per person, from rows grouped by owner and status: how many they hold, and how many of
// those are still open.
export function countLeadsByOwner(rows: Row[]) {
  const counts = new Map<string, LeadCount>();
  for (const row of rows) {
    if (!row.assignedToId) continue;
    const count = counts.get(row.assignedToId) ?? { total: 0, open: 0 };
    count.total += row._count._all;
    if (OPEN_STATUSES.includes(row.status)) count.open += row._count._all;
    counts.set(row.assignedToId, count);
  }
  return counts;
}
