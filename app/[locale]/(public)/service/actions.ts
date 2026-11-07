"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { cancelServiceBooking, createServiceBooking } from "@/lib/service/create-service-booking";
import { getFullServiceSlots } from "@/lib/service/confirm-service";
import type { ServiceBookingInput } from "@/lib/service/schema";

export async function bookService(input: ServiceBookingInput) {
  return createServiceBooking(input);
}

export async function loadFullServiceSlots(showroomId: string) {
  return getFullServiceSlots(z.string().min(1).parse(showroomId));
}

export async function cancelService(formData: FormData) {
  const cancelToken = z.string().min(1).parse(formData.get("cancelToken"));
  await cancelServiceBooking(cancelToken);
  redirect({ href: `/service/booked/${cancelToken}`, locale: await getLocale() });
}
