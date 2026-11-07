import { z } from "zod";
import { auth } from "@/auth";
import { confirmBooking, type BookingResult } from "@/lib/booking/confirm-booking";
import { bookingSchema, type BookingInput } from "@/lib/booking/schema";
import { isBookableSlot } from "@/lib/booking/slots";
import { db } from "@/lib/db";
import { isRateLimited, RATE_LIMITED } from "@/lib/leads/rate-limit";

export type { BookingResult };

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "checkFields", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const booking = parsed.data;

  const demoCar = await db.demoCar.findUnique({
    where: { id: booking.demoCarId },
    select: {
      available: true,
      showroom: { select: { id: true, cityId: true, openMinute: true, closeMinute: true } },
      variant: { select: { id: true, name: true, model: { select: { id: true, name: true } } } },
    },
  });
  if (!demoCar?.available) return { ok: false, error: "demoCarUnavailable" };
  if (!isBookableSlot(booking.slotStart, demoCar.showroom, new Date())) {
    return { ok: false, error: "slotUnavailable" };
  }

  if (await isRateLimited(booking.buyerPhone)) return { ok: false, error: RATE_LIMITED };

  const session = await auth();
  const buyerId = session?.user.role === "BUYER" ? session.user.id : null;

  return confirmBooking(booking, demoCar, buyerId);
}

export { cancelBooking } from "@/lib/booking/confirm-booking";
