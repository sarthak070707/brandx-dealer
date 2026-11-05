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
