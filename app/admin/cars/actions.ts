"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { addVariant, createCar, removeCar, storeCarPhoto, type CarResult, type PhotoResult } from "@/lib/admin/car-service";
import { getAdmin } from "@/lib/auth/staff";
import { CATALOGUE_TAG } from "@/lib/catalogue";

const NOT_ADMIN = { ok: false, error: "Only admins can change the cars." } as const;

// A change reaches the public pages, the sitemap and the booking page within seconds.
function published(result: CarResult) {
  if (result.ok) {
    updateTag(CATALOGUE_TAG);
    refresh();
  }
  return result;
}

export async function uploadCarPhoto(formData: FormData): Promise<PhotoResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  return storeCarPhoto(formData.get("photo"));
}

export async function addCar(input: unknown): Promise<CarResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  return published(await createCar(input));
}

export async function addCarVariant(input: unknown): Promise<CarResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  return published(await addVariant(input));
}

export async function removeCarById(id: string): Promise<CarResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsed = z.string().min(1).safeParse(id);
  return parsed.success ? published(await removeCar(parsed.data)) : { ok: false, error: "That request isn't valid." };
}
