"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { cancelBooking, createBooking } from "@/lib/booking/create-booking";
import { getTakenSlots } from "@/lib/booking/queries";
import type { BookingInput } from "@/lib/booking/schema";

export async function bookTestDrive(input: BookingInput) {
  return createBooking(input);
}

export async function loadTakenSlots(demoCarId: string) {
  return getTakenSlots(z.string().min(1).parse(demoCarId), new Date());
}

export async function cancelTestDrive(formData: FormData) {
  const cancelToken = z.string().min(1).parse(formData.get("cancelToken"));
  await cancelBooking(cancelToken);
  redirect(`/test-drive/booked/${cancelToken}`);
}
