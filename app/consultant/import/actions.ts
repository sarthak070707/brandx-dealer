"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/lib/auth/staff";
import { commitLeadImport, previewLeadImport, type ImportPreview, type ImportResult } from "@/lib/leads/import-service";

type Failure = { ok: false; error: string };
const NOT_STAFF: Failure = { ok: false, error: "Sign in as staff to import leads." };
const BAD_REQUEST: Failure = { ok: false, error: "That request isn't valid." };

const fileSchema = z.object({ csvText: z.string(), showroomId: z.string() });

export async function checkLeadFile(csvText: string, showroomId: string): Promise<ImportPreview | Failure> {
  const staff = await getStaff();
  if (!staff) return NOT_STAFF;
  const parsed = fileSchema.safeParse({ csvText, showroomId });
  return parsed.success ? previewLeadImport(staff, parsed.data.csvText, parsed.data.showroomId) : BAD_REQUEST;
}

export async function importLeadFile(csvText: string, showroomId: string, attested: boolean): Promise<ImportResult | Failure> {
  const staff = await getStaff();
  if (!staff) return NOT_STAFF;
  const parsed = fileSchema.safeParse({ csvText, showroomId });
  if (!parsed.success) return BAD_REQUEST;

  const result = await commitLeadImport(staff, parsed.data.csvText, parsed.data.showroomId, attested === true);
  if (result.ok) refresh();
  return result;
}
