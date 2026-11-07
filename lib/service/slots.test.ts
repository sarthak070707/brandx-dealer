import { describe, expect, it } from "vitest";
import { freeBays, fullSlots, SERVICE_BAYS } from "./slots";

const at = (hour: number) => new Date(`2026-11-10T0${hour}:00:00Z`);

describe("fullSlots", () => {
  it("lists only the slots where every bay is taken", () => {
    const bookings = [at(4), at(4), at(4), at(5), at(5), at(6)];
    expect(SERVICE_BAYS).toBe(3);
    expect(fullSlots(bookings)).toEqual([at(4).toISOString()]);
  });

  it("is empty when nothing is booked or nothing is full", () => {
    expect(fullSlots([])).toEqual([]);
    expect(fullSlots([at(4), at(4)])).toEqual([]);
  });
});

describe("freeBays", () => {
  it("lists the bays nobody has, lowest first, so a freed bay is reused", () => {
    expect(freeBays([])).toEqual([1, 2, 3]);
    expect(freeBays([1])).toEqual([2, 3]);
    expect(freeBays([1, 3])).toEqual([2]);
    expect(freeBays([2, 3])).toEqual([1]);
  });

  it("lists none when every bay is taken", () => {
    expect(freeBays([1, 2, 3])).toEqual([]);
  });
});
