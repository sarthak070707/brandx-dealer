"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { UsedCarStatus } from "@/generated/prisma/enums";
import { removeUsedCar, saveUsedCar, setUsedCarStatus, type UsedCarResult } from "@/lib/admin/used-car-service";
import { getAdmin } from "@/lib/auth/staff";
import { USED_STOCK_TAG } from "@/lib/used-cars/queries";

const NOT_ADMIN = { ok: false, error: "Only admins can change the used stock." } as const;
const BAD_REQUEST = { ok: false, error: "That request isn't valid." } as const;

// A change reaches the public used-car pages, the home page count and the sitemap within seconds.
function published(result: UsedCarResult) {
  if (result.ok) {
    updateTag(USED_STOCK_TAG);
    refresh();
  }
  return result;
}

export async function saveUsedCarAction(input: unknown): Promise<UsedCarResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  return published(await saveUsedCar(input));
}

export async function changeUsedCarStatus(id: string, status: string): Promise<UsedCarResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsed = z.object({ id: z.string().min(1), status: z.enum(UsedCarStatus) }).safeParse({ id, status });
  return parsed.success ? published(await setUsedCarStatus(parsed.data.id, parsed.data.status)) : BAD_REQUEST;
}

export async function removeUsedCarById(id: string): Promise<UsedCarResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsed = z.string().min(1).safeParse(id);
  return parsed.success ? published(await removeUsedCar(parsed.data)) : BAD_REQUEST;
}
