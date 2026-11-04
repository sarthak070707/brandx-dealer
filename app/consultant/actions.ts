"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { LeadStatus } from "@/generated/prisma/enums";
import { getStaff } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { leadScope } from "@/lib/leads/access";
import { validateReassign } from "@/lib/leads/reassign";
import { startsFirstContact, validateStatusChange } from "@/lib/leads/status";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SIGN_IN_AGAIN = { ok: false, error: "Please sign in again." } as const;
const NOT_AVAILABLE = { ok: false, error: "This lead isn't available to you." } as const;
const CHANGED_ELSEWHERE = { ok: false, error: "Someone else just changed this lead. Reload to see the latest." } as const;

const statusInput = z.object({
  leadId: z.string().min(1),
  to: z.enum(LeadStatus),
  lostReason: z.string().max(300).optional(),
});

export async function changeLeadStatus(input: z.input<typeof statusInput>): Promise<ActionResult> {
  const staff = await getStaff();
  if (!staff) return SIGN_IN_AGAIN;
  const parsed = statusInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That change isn't valid." };
  const { leadId, to, lostReason } = parsed.data;

  const scope = leadScope(staff);
  const lead = await db.lead.findFirst({ where: { id: leadId, ...scope }, select: { status: true } });
  if (!lead) return NOT_AVAILABLE;

  const check = validateStatusChange({ from: lead.status, to, lostReason });
  if (!check.ok) return check;

  const changed = await db.$transaction(async (tx) => {
    // Matching on the status we read makes a simultaneous change by someone else fail cleanly.
    const updated = await tx.lead.updateMany({
      where: { id: leadId, status: lead.status, ...scope },
      data: {
        status: to,
        lostReason: check.lostReason,
        ...(startsFirstContact(lead.status, to) && { firstContactAt: new Date() }),
      },
    });
    if (updated.count === 0) return false;
    await tx.leadEvent.create({
      data: {
        leadId,
        type: "STATUS",
        actorId: staff.id,
        details: { from: lead.status, to, ...(check.lostReason && { lostReason: check.lostReason }) },
      },
    });
    return true;
  });
  if (!changed) return CHANGED_ELSEWHERE;

  refresh();
  return { ok: true };
}

const reassignInput = z.object({
  leadId: z.string().min(1),
  toUserId: z.string().min(1),
  reason: z.string().max(300),
});

export async function reassignLead(input: z.input<typeof reassignInput>): Promise<ActionResult> {
  const staff = await getStaff();
  if (!staff) return SIGN_IN_AGAIN;
  const parsed = reassignInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That change isn't valid." };
  const { leadId, toUserId, reason } = parsed.data;

  const scope = leadScope(staff);
  const lead = await db.lead.findFirst({ where: { id: leadId, ...scope }, select: { assignedToId: true } });
  if (!lead) return NOT_AVAILABLE;

  const target = await db.user.findUnique({ where: { id: toUserId }, select: { id: true, role: true, active: true } });
  const check = validateReassign({ actor: staff, assignedToId: lead.assignedToId, target, reason });
  if (!check.ok) return check;

  const changed = await db.$transaction(async (tx) => {
    const updated = await tx.lead.updateMany({
      where: { id: leadId, assignedToId: lead.assignedToId, ...scope },
      data: { assignedToId: toUserId },
    });
    if (updated.count === 0) return false;
    await tx.leadEvent.create({
      data: {
        leadId,
        type: "REASSIGNED",
        actorId: staff.id,
        details: { fromUserId: lead.assignedToId, toUserId, reason: check.reason },
      },
    });
    // Counts as an assignment, so the longest-waiting tie-break stays fair.
    await tx.user.update({ where: { id: toUserId }, data: { lastAssignedAt: new Date() } });
    return true;
  });
  if (!changed) return CHANGED_ELSEWHERE;

  // A consultant can no longer read the lead once it's moved, so the page sends them back to
  // the inbox rather than refreshing a page they've lost access to.
  if (staff.role === "ADMIN") refresh();
  return { ok: true };
}
