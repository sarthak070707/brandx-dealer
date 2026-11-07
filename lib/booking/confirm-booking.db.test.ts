import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cancelBooking, confirmBooking } from "@/lib/booking/confirm-booking";
import { bookingSchema } from "@/lib/booking/schema";
import { bookingDays, isBookableSlot, slotsForDay } from "@/lib/booking/slots";
import { db } from "@/lib/db";

// Needs a database with the seed data. It adds a few bookings and leads under made-up phone numbers
// and removes them again, so run it against a development database (npm run test:db), never a live one.
const PHONES = ["9990000001", "9990000002", "9990000003", "9990000004"];
const STORED_PHONES = PHONES.map((phone) => `+91${phone}`);

let demoCar: NonNullable<Awaited<ReturnType<typeof loadDemoCar>>>;
let slotA: Date;
let slotB: Date;

const loadDemoCar = () =>
  db.demoCar.findFirst({
    where: { available: true },
    select: {
      id: true,
      showroom: { select: { id: true, cityId: true, openMinute: true, closeMinute: true } },
      variant: { select: { id: true, name: true, model: { select: { id: true, name: true } } } },
    },
  });

const book = (phone: string, slot: Date) =>
  confirmBooking(
    bookingSchema.parse({ buyerName: "Database Test", buyerPhone: phone, language: "EN", consent: true, demoCarId: demoCar.id, slotStart: slot.toISOString() }),
    demoCar,
    null,
  );

async function removeTestRows() {
  const owned = { buyerPhone: { in: STORED_PHONES } };
  await db.testDriveBooking.deleteMany({ where: owned });
  await db.leadEvent.deleteMany({ where: { lead: owned } });
  await db.outboxMessage.deleteMany({ where: { lead: owned } });
  await db.lead.deleteMany({ where: owned });
}

beforeAll(async () => {
  const found = await loadDemoCar();
  if (!found) throw new Error("No demo car in this database. Run the seed first.");
  demoCar = found;
  await removeTestRows();

  // Two slots far enough ahead not to clash with the seeded bookings.
  const now = new Date();
  const taken = new Set((await db.testDriveBooking.findMany({ where: { demoCarId: demoCar.id, status: "CONFIRMED" }, select: { slotStart: true } })).map((row) => row.slotStart.getTime()));
  const free = bookingDays(now)
    .slice(-3)
    .flatMap((day) => slotsForDay(day, demoCar.showroom))
    .filter((slot) => isBookableSlot(slot, demoCar.showroom, now) && !taken.has(slot.getTime()));
  [slotA, slotB] = free;
});

afterAll(removeTestRows);

describe("booking the same slot", () => {
  it("gives it to exactly one of two buyers who book at the same moment", async () => {
    const results = await Promise.all([book(PHONES[0], slotA), book(PHONES[1], slotA)]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    const loser = results.find((result) => !result.ok);
    expect(loser).toMatchObject({ ok: false, error: "slotTaken" });
    expect(loser?.ok === false && loser.nextFreeSlots).toHaveLength(3);
    expect(loser?.ok === false && loser.nextFreeSlots).not.toContain(slotA.toISOString());

    const held = await db.testDriveBooking.count({ where: { demoCarId: demoCar.id, slotStart: slotA, status: "CONFIRMED" } });
    expect(held).toBe(1);
  });

  it("leaves no lead behind for the buyer who lost, because the lead and the booking are saved together", async () => {
    const leads = await db.lead.count({ where: { buyerPhone: { in: STORED_PHONES.slice(0, 2) } } });
    expect(leads).toBe(1);
  });

  it("still refuses a buyer who tries the taken slot later", async () => {
    expect(await book(PHONES[2], slotA)).toMatchObject({ ok: false, error: "slotTaken" });
  });

  it("does not stop the same car being booked at a different time", async () => {
    expect(await book(PHONES[3], slotB)).toMatchObject({ ok: true });
  });

  it("frees the slot when its booking is cancelled, so the next buyer can have it", async () => {
    const holder = await db.testDriveBooking.findFirstOrThrow({ where: { demoCarId: demoCar.id, slotStart: slotA, status: "CONFIRMED" }, select: { cancelToken: true } });
    expect(await cancelBooking(holder.cancelToken)).toBe(true);

    expect(await book(PHONES[2], slotA)).toMatchObject({ ok: true });
  });
});
