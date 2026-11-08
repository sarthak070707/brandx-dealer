import { describe, expect, it } from "vitest";
import { cancelledVisit } from "./visit-state";

describe("cancelledVisit", () => {
  it("says nothing for a lead with no visit, or a visit still on", () => {
    expect(cancelledVisit({ booking: null, serviceBooking: null })).toBeNull();
    expect(cancelledVisit({ booking: { status: "CONFIRMED" }, serviceBooking: null })).toBeNull();
    expect(cancelledVisit({ booking: null, serviceBooking: { status: "CONFIRMED" } })).toBeNull();
  });

  it("says which kind of visit the buyer cancelled", () => {
    expect(cancelledVisit({ booking: { status: "CANCELLED" }, serviceBooking: null })).toBe("Test drive cancelled");
    expect(cancelledVisit({ booking: null, serviceBooking: { status: "CANCELLED" } })).toBe("Service visit cancelled");
  });
});
