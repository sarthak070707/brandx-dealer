import { describe, expect, it } from "vitest";
import type { LeadStatus } from "@/generated/prisma/enums";
import { nextStatuses, OPEN_STATUSES, startsFirstContact, validateStatusChange } from "./status";

const ALL: LeadStatus[] = ["NEW", "CONTACTED", "TEST_DRIVE_BOOKED", "NEGOTIATION", "WON", "LOST"];

describe("validateStatusChange", () => {
  it("allows the forward moves of the pipeline", () => {
    expect(validateStatusChange({ from: "NEW", to: "CONTACTED" })).toEqual({ ok: true, lostReason: null });
    expect(validateStatusChange({ from: "CONTACTED", to: "TEST_DRIVE_BOOKED" }).ok).toBe(true);
    expect(validateStatusChange({ from: "CONTACTED", to: "NEGOTIATION" }).ok).toBe(true);
    expect(validateStatusChange({ from: "NEGOTIATION", to: "WON" }).ok).toBe(true);
  });

  it("refuses moves backwards and skips that miss the first call", () => {
    expect(validateStatusChange({ from: "CONTACTED", to: "NEW" }).ok).toBe(false);
    expect(validateStatusChange({ from: "NEW", to: "WON" }).ok).toBe(false);
    expect(validateStatusChange({ from: "NEW", to: "NEGOTIATION" }).ok).toBe(false);
    expect(validateStatusChange({ from: "TEST_DRIVE_BOOKED", to: "WON" }).ok).toBe(false);
  });

  it("treats Won and Lost as final", () => {
    for (const to of ALL) {
      expect(validateStatusChange({ from: "WON", to, lostReason: "x".repeat(5) }).ok).toBe(false);
      expect(validateStatusChange({ from: "LOST", to, lostReason: "x".repeat(5) }).ok).toBe(false);
    }
  });

  it("requires a reason to mark a lead Lost, from any open status", () => {
    for (const from of OPEN_STATUSES) {
      expect(validateStatusChange({ from, to: "LOST" }).ok).toBe(false);
      expect(validateStatusChange({ from, to: "LOST", lostReason: "  " }).ok).toBe(false);
      expect(validateStatusChange({ from, to: "LOST", lostReason: "  Bought elsewhere " })).toEqual({
        ok: true,
        lostReason: "Bought elsewhere",
      });
    }
  });

  it("drops a stray lost reason when the lead is not lost", () => {
    expect(validateStatusChange({ from: "NEW", to: "CONTACTED", lostReason: "ignored" })).toEqual({
      ok: true,
      lostReason: null,
    });
  });
});

describe("nextStatuses and OPEN_STATUSES", () => {
  it("offers nothing after a final status", () => {
    expect(nextStatuses("WON")).toEqual([]);
    expect(nextStatuses("LOST")).toEqual([]);
  });

  it("counts every status except Won and Lost as open", () => {
    expect(OPEN_STATUSES).toEqual(["NEW", "CONTACTED", "TEST_DRIVE_BOOKED", "NEGOTIATION"]);
  });
});

describe("startsFirstContact", () => {
  it("only fires when a new lead becomes Contacted", () => {
    expect(startsFirstContact("NEW", "CONTACTED")).toBe(true);
    expect(startsFirstContact("NEW", "LOST")).toBe(false);
    expect(startsFirstContact("CONTACTED", "NEGOTIATION")).toBe(false);
  });
});
