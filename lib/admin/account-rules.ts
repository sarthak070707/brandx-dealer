import type { Role } from "@/generated/prisma/enums";

type Account = { role: Role; active: boolean };

// An admin can't take their own access away. Since the person making a change is always an
// active admin, this also guarantees the dealership never ends up with no admin.
export function validateAccountChange({ actorId, targetId, current, next }: { actorId: string; targetId: string; current: Account; next: Account }) {
  if (actorId !== targetId) return null;
  if (current.role === "ADMIN" && next.role !== "ADMIN") return "You can't remove your own admin role.";
  if (current.active && !next.active) return "You can't deactivate your own account.";
  return null;
}

// Only an account that is already inactive can be removed, so nobody is deleted by one slip.
// Removing yourself is never allowed.
export function validateAccountRemoval({ actorId, targetId, active }: { actorId: string; targetId: string; active: boolean }) {
  if (actorId === targetId) return "You can't remove your own account.";
  if (active) return "Deactivate this account before removing it.";
  return null;
}
