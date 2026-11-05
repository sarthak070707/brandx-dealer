import { describe, expect, it } from "vitest";
import { findOverlap, overlapMessage, validityStatus } from "./validity";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const range = (from: string, to: string) => ({ validFrom: day(from), validTo: day(to) });
const TODAY = day("2026-11-05");

describe("validityStatus", () => {
  it("tells current, upcoming and expired rows apart, counting both end days as valid", () => {
    expect(validityStatus(range("2026-10-01", "2026-12-31"), TODAY)).toBe("current");
    expect(validityStatus(range("2026-11-05", "2026-11-05"), TODAY)).toBe("current");
    expect(validityStatus(range("2026-11-06", "2027-01-31"), TODAY)).toBe("upcoming");
    expect(validityStatus(range("2026-06-01", "2026-11-04"), TODAY)).toBe("expired");
  });
});

describe("findOverlap: validity", () => {
  const existing = { id: "a", ...range("2026-10-01", "2026-12-31") };

  it("finds a row that applies on any of the same days", () => {
    expect(findOverlap(range("2026-12-01", "2027-02-28"), [existing])).toBe(existing);
    expect(findOverlap(range("2026-11-01", "2026-11-30"), [existing])).toBe(existing);
    expect(findOverlap(range("2026-01-01", "2027-12-31"), [existing])).toBe(existing);
  });

  it("treats a row that starts on the day another ends as overlapping", () => {
    expect(findOverlap(range("2026-12-31", "2027-03-31"), [existing])).toBe(existing);
  });

  it("allows a row that starts the day after another ends, or ends the day before one starts", () => {
    expect(findOverlap(range("2027-01-01", "2027-03-31"), [existing])).toBeUndefined();
    expect(findOverlap(range("2026-07-01", "2026-09-30"), [existing])).toBeUndefined();
  });

  it("finds nothing when there are no other rows", () => {
    expect(findOverlap(range("2026-10-01", "2026-12-31"), [])).toBeUndefined();
  });
});

describe("findOverlap: road tax slabs", () => {
  const TEN_LAKH = 10_00_000_00;
  const dates = range("2026-10-01", "2026-12-31");
  const under10 = { id: "low", ...dates, slabMinPaise: 0, slabMaxPaise: TEN_LAKH };
  const above10 = { id: "high", ...dates, slabMinPaise: TEN_LAKH, slabMaxPaise: null };

  it("lets two ranges meet exactly at a boundary", () => {
    expect(findOverlap({ ...dates, slabMinPaise: TEN_LAKH, slabMaxPaise: null }, [under10])).toBeUndefined();
    expect(findOverlap({ ...dates, slabMinPaise: 0, slabMaxPaise: TEN_LAKH }, [above10])).toBeUndefined();
  });

  it("finds ranges that share any price, including an unlimited one", () => {
    expect(findOverlap({ ...dates, slabMinPaise: 8_00_000_00, slabMaxPaise: 12_00_000_00 }, [under10, above10])).toBe(under10);
    expect(findOverlap({ ...dates, slabMinPaise: 20_00_000_00, slabMaxPaise: null }, [under10, above10])).toBe(above10);
  });

  it("allows the same price range on different dates", () => {
    expect(findOverlap({ ...range("2027-01-01", "2027-03-31"), slabMinPaise: 0, slabMaxPaise: null }, [under10, above10])).toBeUndefined();
  });
});

describe("overlapMessage", () => {
  it("names the dates of the row in the way", () => {
    expect(overlapMessage(range("2026-10-01", "2026-12-31"))).toBe(
      "Overlaps another row valid 01 Oct 2026 to 31 Dec 2026. End or move that row first.",
    );
  });
});
