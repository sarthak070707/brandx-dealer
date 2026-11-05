import { z } from "zod";
import { auth } from "@/auth";
import { bookingSchema, type BookingInput } from "@/lib/booking/schema";
import { isBookableSlot, slotsForDay, bookingDays } from "@/lib/booking/slots";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { createLead } from "@/lib/leads/create-lead";
import { isRateLimited, RATE_LIMITED_MESSAGE } from "@/lib/leads/rate-limit";

const NEXT_FREE_SLOT_COUNT = 3;

export type BookingResult =
  | { ok: true; cancelToken: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]>; nextFreeSlots?: string[] };

async function nextFreeSlots(demoCarId: string, hours: { openMinute: number; closeMinute: number }, after: Date) {
  const now = new Date();
  const taken = new Set(
    (await db.testDriveBooking.findMany({ where: { demoCarId, status: "CONFIRMED" }, select: { slotStart: true } })).map(
      (booking) => booking.slotStart.getTime(),
    ),
  );
  return bookingDays(now)
    .flatMap((day) => slotsForDay(day, hours))
    .filter((slot) => slot > after && slot > now && !taken.has(slot.getTime()))
    .slice(0, NEXT_FREE_SLOT_COUNT)
    .map((slot) => slot.toISOString());
}

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
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
  if (!demoCar?.available) return { ok: false, error: "This demo car is not available for test drives right now." };
  if (!isBookableSlot(booking.slotStart, demoCar.showroom, new Date())) {
    return { ok: false, error: "That time is no longer available. Please pick another slot." };
  }

  if (await isRateLimited(booking.buyerPhone)) return { ok: false, error: RATE_LIMITED_MESSAGE };

  const session = await auth();
  const buyerId = session?.user.role === "BUYER" ? session.user.id : null;

  try {
    const created = await db.$transaction(async (tx) => {
      const { lead } = await createLead(tx, {
        source: "TEST_DRIVE",
        buyerName: booking.buyerName,
        buyerPhone: booking.buyerPhone,
        language: booking.language,
        modelId: demoCar.variant.model.id,
        variantId: demoCar.variant.id,
        cityId: demoCar.showroom.cityId,
        showroomId: demoCar.showroom.id,
        carLabel: `${demoCar.variant.model.name} ${demoCar.variant.name}`,
      });
      return tx.testDriveBooking.create({
        data: {
          demoCarId: booking.demoCarId,
          slotStart: booking.slotStart,
          buyerName: booking.buyerName,
          buyerPhone: booking.buyerPhone,
          language: booking.language,
          consentAt: lead.consentAt,
          buyerId,
          leadId: lead.id,
        },
        select: { cancelToken: true },
      });
    });
    return { ok: true, cancelToken: created.cancelToken };
  } catch (error) {
    // The database's unique rule on (demo car, slot) decides races, not this code.
    if (!isUniqueViolation(error)) throw error;
    return {
      ok: false,
      error: "That slot was just taken. Here are the next free ones.",
      nextFreeSlots: await nextFreeSlots(booking.demoCarId, demoCar.showroom, booking.slotStart),
    };
  }
}

export async function cancelBooking(cancelToken: string) {
  return db.$transaction(async (tx) => {
    const booking = await tx.testDriveBooking.updateMany({
      where: { cancelToken, status: "CONFIRMED", slotStart: { gt: new Date() } },
      data: { status: "CANCELLED" },
    });
    if (booking.count === 0) return false;
    const { leadId } = await tx.testDriveBooking.findUniqueOrThrow({ where: { cancelToken }, select: { leadId: true } });
    await tx.leadEvent.create({ data: { leadId, type: "NOTE", details: { note: "Buyer cancelled the test drive" } } });
    return true;
  });
}
