"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { removeAccount, resetPassword, saveAccount, type AccountResult } from "@/lib/admin/user-service";
import { getAdmin } from "@/lib/auth/staff";

const NOT_ADMIN = { ok: false, error: "Only admins can manage accounts." } as const;

// Whatever changed, the table on screen is redrawn from the database.
function refreshed(result: AccountResult) {
  if (result.ok) refresh();
  return result;
}

export async function saveStaffAccount(input: unknown): Promise<AccountResult> {
  const admin = await getAdmin();
  return admin ? refreshed(await saveAccount(admin, input)) : NOT_ADMIN;
}

export async function resetStaffPassword(id: string): Promise<AccountResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsed = z.string().min(1).safeParse(id);
  return parsed.success ? refreshed(await resetPassword(parsed.data)) : { ok: false, error: "That request isn't valid." };
}

export async function removeStaffAccount(id: string): Promise<AccountResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const parsed = z.string().min(1).safeParse(id);
  return parsed.success ? refreshed(await removeAccount(admin, parsed.data)) : { ok: false, error: "That request isn't valid." };
}
