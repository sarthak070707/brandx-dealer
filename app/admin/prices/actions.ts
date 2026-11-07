"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { isPriceTableId } from "@/lib/admin/price-tables";
import { RESOLUTIONS } from "@/lib/admin/validity";
import { deletePriceRow, savePriceRow, type SaveResult } from "@/lib/admin/price-service";
import { getAdmin } from "@/lib/auth/staff";
import { CATALOGUE_TAG } from "@/lib/catalogue";

const NOT_ADMIN = { ok: false, error: "Only admins can change prices." } as const;
const BAD_REQUEST = { ok: false, error: "That request isn't valid." } as const;

// A change takes effect on the public car pages straight away, with no deploy and no code change.
function published(result: SaveResult) {
  if (result.ok) {
    updateTag(CATALOGUE_TAG);
    refresh();
  }
  return result;
}

// resolution is only set when the admin pressed the button that settles an overlapping row.
export async function savePrice(table: string, input: unknown, resolution?: string): Promise<SaveResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const chosen = z.enum(RESOLUTIONS).optional().safeParse(resolution);
  return isPriceTableId(table) && chosen.success ? published(await savePriceRow(table, input, chosen.data)) : BAD_REQUEST;
}

export async function deletePrice(table: string, id: string): Promise<SaveResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsedId = z.string().min(1).safeParse(id);
  return isPriceTableId(table) && parsedId.success ? published(await deletePriceRow(table, parsedId.data)) : BAD_REQUEST;
}
