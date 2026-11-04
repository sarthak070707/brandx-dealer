import type { LeadStatus } from "@/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/leads/labels";

// New → Contacted → Test drive booked → Negotiation → Won, with Lost allowed from any open
// status. A lead may skip Test drive booked (e.g. a used-car enquiry that goes straight to
// negotiation), but never moves backwards, and Won and Lost are final.
const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["TEST_DRIVE_BOOKED", "NEGOTIATION", "LOST"],
  TEST_DRIVE_BOOKED: ["NEGOTIATION", "LOST"],
  NEGOTIATION: ["WON", "LOST"],
  WON: [],
  LOST: [],
};

export const MIN_REASON_LENGTH = 3;

export const nextStatuses = (from: LeadStatus) => TRANSITIONS[from];

const isOpen = (status: LeadStatus) => TRANSITIONS[status].length > 0;

export const OPEN_STATUSES = (Object.keys(TRANSITIONS) as LeadStatus[]).filter(isOpen);

// A13: the response timer stops when the consultant first moves the lead to Contacted.
export const startsFirstContact = (from: LeadStatus, to: LeadStatus) => from === "NEW" && to === "CONTACTED";

type StatusChange = { from: LeadStatus; to: LeadStatus; lostReason?: string | null };
export type StatusValidation = { ok: true; lostReason: string | null } | { ok: false; error: string };

export function validateStatusChange({ from, to, lostReason }: StatusChange): StatusValidation {
  if (!TRANSITIONS[from].includes(to)) {
    return { ok: false, error: `A lead can't move from ${STATUS_LABEL[from]} to ${STATUS_LABEL[to]}.` };
  }
  if (to !== "LOST") return { ok: true, lostReason: null };

  const reason = lostReason?.trim() ?? "";
  if (reason.length < MIN_REASON_LENGTH) return { ok: false, error: "Say why the lead was lost." };
  return { ok: true, lostReason: reason };
}
