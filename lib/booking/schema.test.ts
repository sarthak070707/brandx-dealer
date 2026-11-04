import { describe, expect, it } from "vitest";
import { bookingSchema } from "./schema";

describe("bookingSchema", () => {
  const valid = {
    demoCarId: "car-1",
    slotStart: "2026-11-04T05:30:00.000Z",
    buyerName: "Asha Rao",
    buyerPhone: "9876543210",
    language: "EN",
    consent: true,
  };

  it("accepts a complete booking and turns the slot into a date", () => {
    const parsed = bookingSchema.parse(valid);
    expect(parsed.slotStart).toEqual(new Date("2026-11-04T05:30:00.000Z"));
    expect(parsed.buyerPhone).toBe("+919876543210");
  });

  it("refuses a booking without consent", () => {
    expect(bookingSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("refuses a slot that is not an ISO date", () => {
    expect(bookingSchema.safeParse({ ...valid, slotStart: "tomorrow" }).success).toBe(false);
  });
});
