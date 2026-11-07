import { z } from "zod";
import { isBookableSlot } from "@/lib/booking/slots";
import { db } from "@/lib/db";
import { isRateLimited, RATE_LIMITED } from "@/lib/leads/rate-limit";
import { confirmServiceBooking, type ServiceResult } from "@/lib/service/confirm-service";
import { serviceBookingSchema, type ServiceBookingInput } from "@/lib/service/schema";

export type { ServiceResult };

export async function createServiceBooking(input: ServiceBookingInput): Promise<ServiceResult> {
  const parsed = serviceBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "checkFields", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const booking = parsed.data;

  // The id comes from the browser, so it is only looked up here, and the hours come from the database.
  const showroom = await db.showroom.findUnique({ where: { id: booking.showroomId }, select: { id: true, cityId: true, openMinute: true, closeMinute: true } });
  if (!showroom) return { ok: false, error: "checkFields", fieldErrors: { showroomId: ["showroom"] } };
  if (!isBookableSlot(booking.slotStart, showroom, new Date())) return { ok: false, error: "slotUnavailable" };
  if (await isRateLimited(booking.buyerPhone)) return { ok: false, error: RATE_LIMITED };

  return confirmServiceBooking(booking, showroom);
}

export { cancelServiceBooking } from "@/lib/service/confirm-service";
