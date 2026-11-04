import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";

export type StaffUser = { id: string; role: Role };

// Every lead query spreads this into its where clause, so a consultant can never read or
// change a lead that isn't theirs, whatever the page or action asks for. Admins see all.
export function leadScope(user: StaffUser): Prisma.LeadWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "CONSULTANT") return { assignedToId: user.id };
  throw new Error("Only staff can read leads");
}
