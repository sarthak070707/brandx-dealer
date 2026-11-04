import { describe, expect, it } from "vitest";
import { formatClock, formatDate, formatSlot, formatSlotTime, indiaToday } from "./dates";

describe("indiaToday", () => {
  it("returns the IST calendar date at midnight UTC", () => {
    expect(indiaToday(new Date("2026-11-03T10:00:00Z")).toISOString()).toBe("2026-11-03T00:00:00.000Z");
  });

  it("rolls over at IST midnight, not UTC midnight", () => {
    expect(indiaToday(new Date("2026-11-03T18:29:00Z")).toISOString()).toBe("2026-11-03T00:00:00.000Z");
    expect(indiaToday(new Date("2026-11-03T18:30:00Z")).toISOString()).toBe("2026-11-04T00:00:00.000Z");
  });
});

describe("formatClock", () => {
  it("formats minutes after midnight as 24-hour time", () => {
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(1080)).toBe("18:00");
    expect(formatClock(570)).toBe("09:30");
  });
});

describe("formatDate", () => {
  it("formats a validity date as DD MMM YYYY", () => {
    expect(formatDate(new Date("2027-01-31T00:00:00Z"))).toBe("31 Jan 2027");
  });
});

describe("formatSlot", () => {
  it("shows a UTC instant in IST", () => {
    const slot = new Date("2026-11-04T05:30:00Z");
    expect(formatSlotTime(slot)).toBe("11:00 am");
    expect(formatSlot(slot)).toBe("Wed, 4 Nov, 11:00 am");
  });
});
