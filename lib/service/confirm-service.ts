import type { z } from "zod";
import { bookingDays, slotsForDay } from "@/lib/booking/slots";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { createLead } from "@/lib/leads/create-lead";
import type { PublicError } from "@/lib/public-errors";
import { composeServiceMessage, serviceTopic } from "@/lib/service/message";
import type { serviceBookingSchema } from "@/lib/service/schema";
import { freeBays, fullSlots } from "@/lib/service/slots";

const NEXT_FREE_SLOT_COUNT = 3;

export type ServiceResult =
  | { ok: true; cancelToken: string }
  | { ok: false; error: PublicError; fieldErrors?: Record<string, string[]>; nextFreeSlots?: string[] };

type Booking = z.output<typeof serviceBookingSchema>;
type ShowroomFacts = { id: string; cityId: string; openMinute: number; closeMinute: number };

// The slots of a showroom with every bay taken, as ISO strings: what the date picker greys out.
export async function getFullServiceSlots(showroomId: string) {
  const booked = await db.serviceBooking.findMany({ where: { showroomId, status: "CONFIRMED", slotStart: { gte: new Date() } }, select: { slotStart: true } });
  return fullSlots(booked.map((row) => row.slotStart));
}

async function nextFreeServiceSlots(showroom: ShowroomFacts, after: Date) {
  const now = new Date();
  const full = new Set(await getFullServiceSlots(showroom.id));
  return bookingDays(now)
    .flatMap((day) => slotsForDay(day, showroom))
    .filter((slot) => slot > after && slot > now && !full.has(slot.toISOString()))
    .slice(0, NEXT_FREE_SLOT_COUNT)
    .map((slot) => slot.toISOString());
}

// A booking takes the lowest free bay. The lead and the booking are saved together, and the database
// allows one confirmed booking per bay per slot, so when two customers pick the last bay at the same
// moment only one gets it: the other's attempt is undone whole, and they are offered the next free slots.
export async function confirmServiceBooking(booking: Booking, showroom: ShowroomFacts): Promise<ServiceResult> {
  const taken = await db.serviceBooking.findMany({
    where: { showroomId: showroom.id, slotStart: booking.slotStart, status: "CONFIRMED" },
    select: { bay: true },
  });

  for (const bay of freeBays(taken.map((row) => row.bay))) {
    try {
      const created = await db.$transaction(async (tx) => {
        const { lead } = await createLead(tx, {
          source: "SERVICE",
          buyerName: booking.buyerName,
          buyerPhone: booking.buyerPhone,
          language: booking.language,
          message: composeServiceMessage(booking),
          cityId: showroom.cityId,
          showroomId: showroom.id,
          carLabel: serviceTopic(booking.language, booking.serviceType),
        });
        return tx.serviceBooking.create({
          data: {
            showroomId: showroom.id,
            bay,
            slotStart: booking.slotStart,
            serviceType: booking.serviceType,
            vehicle: booking.vehicle,
            regNumber: booking.regNumber,
            km: booking.km,
            notes: booking.notes,
            buyerName: booking.buyerName,
            buyerPhone: booking.buyerPhone,
            language: booking.language,
            consentAt: lead.consentAt,
            leadId: lead.id,
          },
          select: { cancelToken: true },
        });
      });
      return { ok: true, cancelToken: created.cancelToken };
    } catch (error) {
      // Someone took this bay a moment ago; try the next one.
      if (!isUniqueViolation(error)) throw error;
    }
  }
  return { ok: false, error: "slotTaken", nextFreeSlots: await nextFreeServiceSlots(showroom, booking.slotStart) };
}

export async function cancelServiceBooking(cancelToken: string) {
  return db.$transaction(async (tx) => {
    const cancelled = await tx.serviceBooking.updateMany({
      where: { cancelToken, status: "CONFIRMED", slotStart: { gt: new Date() } },
      data: { status: "CANCELLED" },
    });
    if (cancelled.count === 0) return false;
    const { leadId } = await tx.serviceBooking.findUniqueOrThrow({ where: { cancelToken }, select: { leadId: true } });
    await tx.leadEvent.create({ data: { leadId, type: "NOTE", details: { note: "Customer cancelled the service booking" } } });
    return true;
  });
}
