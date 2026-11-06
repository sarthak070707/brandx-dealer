import { cacheLife } from "next/cache";
import { db } from "@/lib/db";
import { istDay } from "@/lib/booking/slots";

export type BookingOptions = Awaited<ReturnType<typeof getBookingOptions>>;

export async function getBookingOptions() {
  "use cache";
  cacheLife("minutes");

  const showrooms = await db.showroom.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      openMinute: true,
      closeMinute: true,
      demoCars: {
        select: {
          id: true,
          available: true,
          variant: {
            select: {
              name: true,
              fuel: true,
              transmission: true,
              model: { select: { slug: true, name: true, photos: true } },
            },
          },
        },
      },
    },
  });
  return showrooms.map((showroom) => ({
    ...showroom,
    demoCars: showroom.demoCars.toSorted((a, b) => a.variant.model.name.localeCompare(b.variant.model.name)),
  }));
}

// Only confirmed bookings hold a slot; cancelled ones free it again.
export async function getTakenSlots(demoCarId: string, now: Date) {
  const bookings = await db.testDriveBooking.findMany({
    where: { demoCarId, status: "CONFIRMED", slotStart: { gte: new Date(`${istDay(now)}T00:00:00+05:30`) } },
    select: { slotStart: true },
  });
  return bookings.map((booking) => booking.slotStart.toISOString());
}

export async function getBookingByToken(cancelToken: string) {
  return db.testDriveBooking.findUnique({
    where: { cancelToken },
    select: {
      cancelToken: true,
      slotStart: true,
      status: true,
      buyerName: true,
      demoCar: {
        select: {
          showroom: { select: { name: true, address: true } },
          variant: { select: { name: true, model: { select: { name: true } } } },
        },
      },
      lead: { select: { optedOutAt: true, assignedTo: { select: { name: true } } } },
    },
  });
}
