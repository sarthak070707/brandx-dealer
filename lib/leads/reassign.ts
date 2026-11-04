import type { Role } from "@/generated/prisma/enums";
import { MIN_REASON_LENGTH } from "@/lib/leads/status";
import type { StaffUser } from "@/lib/leads/access";

type Target = { id: string; role: Role; active: boolean };
type ReassignRequest = { actor: StaffUser; assignedToId: string | null; target: Target | null; reason: string };
export type ReassignValidation = { ok: true; reason: string } | { ok: false; error: string };

// Spec: the assigned consultant or an admin can move a lead, with a required reason.
export function validateReassign({ actor, assignedToId, target, reason }: ReassignRequest): ReassignValidation {
  if (actor.role !== "ADMIN" && assignedToId !== actor.id) {
    return { ok: false, error: "Only the assigned consultant or an admin can re-assign this lead." };
  }
  if (!target || target.role !== "CONSULTANT" || !target.active) {
    return { ok: false, error: "Pick an active consultant." };
  }
  if (target.id === assignedToId) return { ok: false, error: "This lead is already assigned to them." };

  const trimmed = reason.trim();
  if (trimmed.length < MIN_REASON_LENGTH) return { ok: false, error: "Add a reason for the re-assignment." };
  return { ok: true, reason: trimmed };
}
