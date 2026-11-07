import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bookingDays, isBookableSlot, slotsForDay } from "@/lib/booking/slots";
import { db } from "@/lib/db";
import { cancelServiceBooking, confirmServiceBooking } from "@/lib/service/confirm-service";
import { serviceBookingSchema } from "@/lib/service/schema";
import { SERVICE_BAYS } from "@/lib/service/slots";

// Needs a database with the seed data. It adds a few bookings and leads under made-up phone numbers and
// removes them again, so run it against a development database (npm run test:db), never a live one.
const PHONES = ["9990001001", "9990001002", "9990001003", "9990001004", "9990001005", "9990001006"];
const STORED_PHONES = PHONES.map((phone) => `+91${phone}`);

type Showroom = { id: string; cityId: string; openMinute: number; closeMinute: number };
let showroom: Showroom;
let otherShowroom: Showroom;
let slot: Date;

const book = (phone: string, at: Date, where: Showroom = showroom) =>
  confirmServiceBooking(
    serviceBookingSchema.parse({
      buyerName: "Database Test",
      buyerPhone: phone,
      language: "EN",
      consent: true,
      showroomId: where.id,
      slotStart: at.toISOString(),
      serviceType: "PERIODIC",
      vehicle: "Test Car",
      regNumber: "UP32AB1234",
      km: "12000",
      notes: "",
    }),
    where,
  );

async function removeTestRows() {
  const owned = { buyerPhone: { in: STORED_PHONES } };
  await db.serviceBooking.deleteMany({ where: owned });
  await db.leadEvent.deleteMany({ where: { lead: owned } });
  await db.outboxMessage.deleteMany({ where: { lead: owned } });
  await db.lead.deleteMany({ where: owned });
}

beforeAll(async () => {
  const showrooms = await db.showroom.findMany({ select: { id: true, cityId: true, openMinute: true, closeMinute: true }, orderBy: { name: "asc" }, take: 2 });
  if (showrooms.length < 2) throw new Error("This database needs two showrooms. Run the seed first.");
  [showroom, otherShowroom] = showrooms;
  await removeTestRows();

  const now = new Date();
  [slot] = bookingDays(now)
    .slice(-2)
    .flatMap((day) => slotsForDay(day, showroom))
    .filter((candidate) => isBookableSlot(candidate, showroom, now));
});

afterAll(removeTestRows);

describe("service bays", () => {
  it("gives each customer a different bay and refuses the one who comes when every bay is taken", async () => {
    expect(SERVICE_BAYS).toBe(3);
    const results = await Promise.all(PHONES.slice(0, 4).map((phone) => book(phone, slot)));

    expect(results.filter((result) => result.ok)).toHaveLength(SERVICE_BAYS);
    const refused = results.filter((result) => !result.ok);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toMatchObject({ ok: false, error: "slotTaken" });
    expect(refused[0].ok === false && refused[0].nextFreeSlots).toHaveLength(3);
    expect(refused[0].ok === false && refused[0].nextFreeSlots).not.toContain(slot.toISOString());

    const bays = (await db.serviceBooking.findMany({ where: { showroomId: showroom.id, slotStart: slot, status: "CONFIRMED" }, select: { bay: true } })).map((row) => row.bay).sort();
    expect(bays).toEqual([1, 2, 3]);
  });

  it("leaves no lead behind for the customer who was refused, because the lead and the booking are saved together", async () => {
    expect(await db.lead.count({ where: { buyerPhone: { in: STORED_PHONES.slice(0, 4) } } })).toBe(SERVICE_BAYS);
  });

  it("makes each booking a lead for a consultant to confirm, with the service in its message", async () => {
    const lead = await db.lead.findFirstOrThrow({ where: { buyerPhone: { in: STORED_PHONES }, source: "SERVICE" }, select: { message: true, assignedToId: true, showroomId: true } });
    expect(lead.message).toContain("Service booking: Periodic service");
    expect(lead.message).toContain("UP32AB1234");
    expect(lead.showroomId).toBe(showroom.id);
  });

  it("does not stop another showroom taking the same time", async () => {
    expect(await book(PHONES[4], slot, otherShowroom)).toMatchObject({ ok: true });
  });

  it("frees a bay when a booking is cancelled, so the next customer can have it", async () => {
    const holder = await db.serviceBooking.findFirstOrThrow({ where: { showroomId: showroom.id, slotStart: slot, status: "CONFIRMED" }, select: { cancelToken: true, bay: true } });
    expect(await cancelServiceBooking(holder.cancelToken)).toBe(true);
    expect(await cancelServiceBooking(holder.cancelToken)).toBe(false);

    expect(await book(PHONES[5], slot)).toMatchObject({ ok: true });
    const bays = (await db.serviceBooking.findMany({ where: { showroomId: showroom.id, slotStart: slot, status: "CONFIRMED" }, select: { bay: true } })).map((row) => row.bay).sort();
    expect(bays).toEqual([1, 2, 3]);
  });
});
