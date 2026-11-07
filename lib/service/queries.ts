import { db } from "@/lib/db";

// What the confirmation page shows, found by the secret in its link.
export async function getServiceBookingByToken(cancelToken: string) {
  return db.serviceBooking.findUnique({
    where: { cancelToken },
    select: {
      slotStart: true,
      serviceType: true,
      vehicle: true,
      regNumber: true,
      status: true,
      cancelToken: true,
      showroom: { select: { name: true, address: true } },
      lead: { select: { optedOutAt: true, assignedTo: { select: { name: true } } } },
    },
  });
}
