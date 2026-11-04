import { describe, expect, it } from "vitest";
import { bookingDays, isBookableSlot, istDay, slotsForDay } from "./slots";

const HOURS = { openMinute: 600, closeMinute: 1080 };
// Tuesday 3 Nov 2026, 15:00 IST.
const NOW = new Date("2026-11-03T09:30:00Z");
const ist = (day: string, time: string) => new Date(`${day}T${time}:00+05:30`);

describe("istDay", () => {
  it("rolls over at IST midnight", () => {
    expect(istDay(new Date("2026-11-03T18:29:00Z"))).toBe("2026-11-03");
    expect(istDay(new Date("2026-11-03T18:30:00Z"))).toBe("2026-11-04");
  });
});

describe("bookingDays", () => {
  it("covers today to 14 days ahead and skips Sundays", () => {
    const days = bookingDays(NOW);
    expect(days[0]).toBe("2026-11-03");
    expect(days.at(-1)).toBe("2026-11-17");
    expect(days).not.toContain("2026-11-08");
    expect(days).toHaveLength(13);
  });
});

describe("slotsForDay", () => {
  it("gives 30-minute slots from opening until the last one that ends by closing", () => {
    const slots = slotsForDay("2026-11-04", HOURS);
    expect(slots).toHaveLength(16);
    expect(slots[0]).toEqual(ist("2026-11-04", "10:00"));
    expect(slots.at(-1)).toEqual(ist("2026-11-04", "17:30"));
  });
});

describe("isBookableSlot", () => {
  it("accepts a future slot inside hours", () => {
    expect(isBookableSlot(ist("2026-11-04", "11:00"), HOURS, NOW)).toBe(true);
    expect(isBookableSlot(ist("2026-11-03", "17:30"), HOURS, NOW)).toBe(true);
  });

  it("rejects past slots, including earlier today", () => {
    expect(isBookableSlot(ist("2026-11-03", "15:00"), HOURS, NOW)).toBe(false);
    expect(isBookableSlot(ist("2026-11-02", "11:00"), HOURS, NOW)).toBe(false);
  });

  it("rejects slots outside showroom hours", () => {
    expect(isBookableSlot(ist("2026-11-04", "09:30"), HOURS, NOW)).toBe(false);
    expect(isBookableSlot(ist("2026-11-04", "18:00"), HOURS, NOW)).toBe(false);
  });

  it("rejects times that are not on a slot boundary", () => {
    expect(isBookableSlot(ist("2026-11-04", "10:15"), HOURS, NOW)).toBe(false);
  });

  it("rejects Sundays and days beyond the 14-day window", () => {
    expect(isBookableSlot(ist("2026-11-08", "11:00"), HOURS, NOW)).toBe(false);
    expect(isBookableSlot(ist("2026-11-18", "11:00"), HOURS, NOW)).toBe(false);
  });
});
