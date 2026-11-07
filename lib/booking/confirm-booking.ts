import type { z } from "zod";
import { bookingDays, slotsForDay } from "@/lib/booking/slots";
import type { bookingSchema } from "@/lib/booking/schema";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { createLead } from "@/lib/leads/create-lead";
import type { PublicError } from "@/lib/public-errors";

const NEXT_FREE_SLOT_COUNT = 3;

export type BookingResult =
  | { ok: true; cancelToken: string }
  | { ok: false; error: PublicError; fieldErrors?: Record<string, string[]>; nextFreeSlots?: string[] };

type Booking = z.output<typeof bookingSchema>;
type DemoCarFacts = {
  showroom: { id: string; cityId: string; openMinute: number; closeMinute: number };
  variant: { id: string; name: string; model: { id: string; name: string } };
};

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

// The part of a booking that must be right when two buyers pick the same slot at once: the lead and
// the booking are saved together, and the database's unique rule on (demo car, slot) decides who
// gets it. The loser is told the next free slots.
export async function confirmBooking(booking: Booking, demoCar: DemoCarFacts, buyerId: string | null): Promise<BookingResult> {
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
    if (!isUniqueViolation(error)) throw error;
    return { ok: false, error: "slotTaken", nextFreeSlots: await nextFreeSlots(booking.demoCarId, demoCar.showroom, booking.slotStart) };
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
