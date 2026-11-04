import { z } from "zod";
import { LeadStatus, type LeadEventType } from "@/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/leads/labels";

export type LeadEventRecord = { type: LeadEventType; details: unknown };

const assigned = z.object({ reason: z.string(), toUserId: z.string().nullable() });
const reassigned = z.object({ fromUserId: z.string().nullable(), toUserId: z.string(), reason: z.string() });
const statusChange = z.object({ from: z.enum(LeadStatus), to: z.enum(LeadStatus), lostReason: z.string().nullish() });
const note = z.object({ note: z.string() });
const message = z.object({ channel: z.string(), kind: z.literal("reply").optional() });
const userRefs = z.object({ fromUserId: z.string().nullish(), toUserId: z.string().nullish() });

// Consultants named inside event details, so the page can look their names up in one query.
export function referencedUserIds(events: LeadEventRecord[]) {
  const ids = new Set<string>();
  for (const event of events) {
    const refs = userRefs.safeParse(event.details);
    if (!refs.success) continue;
    for (const id of [refs.data.fromUserId, refs.data.toUserId]) if (id) ids.add(id);
  }
  return [...ids];
}

const CHANNEL_LABEL: Record<string, string> = { WHATSAPP: "WhatsApp", SMS: "SMS" };

// One plain-language line per history event; the actor and time are shown beside it.
export function describeEvent({ type, details }: LeadEventRecord, names: ReadonlyMap<string, string>) {
  const nameOf = (id: string) => names.get(id) ?? "a former consultant";

  if (type === "ASSIGNED") {
    const parsed = assigned.safeParse(details);
    if (parsed.success && parsed.data.toUserId) return `Assigned to ${nameOf(parsed.data.toUserId)} automatically`;
    if (parsed.success) return "No consultant handles this car at the showroom, so it went to the lead desk";
  }
  if (type === "REASSIGNED") {
    const parsed = reassigned.safeParse(details);
    if (parsed.success) {
      const from = parsed.data.fromUserId ? nameOf(parsed.data.fromUserId) : "the lead desk";
      return `Re-assigned from ${from} to ${nameOf(parsed.data.toUserId)}: ${parsed.data.reason}`;
    }
  }
  if (type === "STATUS") {
    const parsed = statusChange.safeParse(details);
    if (parsed.success) {
      const move = `Status changed from ${STATUS_LABEL[parsed.data.from]} to ${STATUS_LABEL[parsed.data.to]}`;
      return parsed.data.lostReason ? `${move}: ${parsed.data.lostReason}` : move;
    }
  }
  if (type === "NOTE") {
    const parsed = note.safeParse(details);
    if (parsed.success) return parsed.data.note;
  }
  if (type === "MESSAGE") {
    const parsed = message.safeParse(details);
    if (parsed.success) {
      const channel = CHANNEL_LABEL[parsed.data.channel] ?? parsed.data.channel;
      return `${parsed.data.kind === "reply" ? "Reply" : "Acknowledgement"} sent on ${channel} (simulated)`;
    }
  }
  return "Update recorded";
}
