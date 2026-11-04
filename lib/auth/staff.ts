import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { StaffUser } from "@/lib/leads/access";

export type CurrentStaff = StaffUser & { name: string };

// The role comes from the database, not the session token, so a demoted or deactivated
// account loses access at once instead of when its token expires.
export async function getStaff(): Promise<CurrentStaff | null> {
  const session = await auth();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true, active: true },
  });
  if (!user?.active || (user.role !== "CONSULTANT" && user.role !== "ADMIN")) return null;
  return user;
}

export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect("/sign-in");
  return staff;
}
