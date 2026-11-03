import { describe, expect, it } from "vitest";
import { formatClock, indiaToday } from "./dates";

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
