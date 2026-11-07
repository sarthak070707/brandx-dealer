import { describe, expect, it } from "vitest";
import { dayAfter, dayBefore, findOverlap, findOverlaps, overlapMessage, overlapResolution, resolutionLabel, validityStatus } from "./validity";

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

describe("findOverlaps", () => {
  it("lists every row in the way, not just the first", () => {
    const a = { id: "a", ...range("2026-01-01", "2026-06-30") };
    const b = { id: "b", ...range("2026-07-01", "2026-12-31") };
    const c = { id: "c", ...range("2027-01-01", "2027-06-30") };
    expect(findOverlaps(range("2026-06-01", "2026-08-31"), [a, b, c])).toEqual([a, b]);
  });
});

describe("overlapResolution", () => {
  const current = range("2026-10-07", "2027-02-04");

  it("ends the old row early for a normal price change: the new row starts later and runs at least as long", () => {
    expect(overlapResolution(current, range("2026-11-20", "2027-06-30"))).toBe("end-early");
    expect(overlapResolution(current, range("2026-11-20", "2027-02-04"))).toBe("end-early");
  });

  it("replaces the old row when the new one covers all of it, including the very same dates", () => {
    expect(overlapResolution(current, range("2026-10-07", "2027-02-04"))).toBe("replace");
    expect(overlapResolution(current, range("2026-10-07", "2027-06-30"))).toBe("replace");
    expect(overlapResolution(current, range("2026-09-01", "2027-06-30"))).toBe("replace");
  });

  it("starts the old row later when it runs on past the new one, which covers only its first part", () => {
    expect(overlapResolution(current, range("2026-09-01", "2026-12-31"))).toBe("start-later");
    expect(overlapResolution(current, range("2026-10-07", "2026-12-31"))).toBe("start-later");
  });

  it("offers nothing when the new row sits strictly inside the old one, which would split it", () => {
    expect(overlapResolution(current, range("2026-11-20", "2026-12-31"))).toBeNull();
  });
});

describe("dayBefore and dayAfter", () => {
  it("step one calendar day, across a month end", () => {
    expect(dayBefore(day("2026-12-01")).toISOString().slice(0, 10)).toBe("2026-11-30");
    expect(dayAfter(day("2026-11-30")).toISOString().slice(0, 10)).toBe("2026-12-01");
  });
});

describe("overlapMessage", () => {
  const clash = range("2026-10-01", "2026-12-31");

  it("names the dates of the row in the way, and says how to settle it", () => {
    expect(overlapMessage(clash, "end-early")).toBe("Overlaps a row valid 01 Oct 2026 to 31 Dec 2026. You can end that row the day before this one starts.");
    expect(overlapMessage(clash, "start-later")).toBe("Overlaps a row valid 01 Oct 2026 to 31 Dec 2026. You can start that row the day after this one ends.");
    expect(overlapMessage(clash, "replace")).toBe("Overlaps a row valid 01 Oct 2026 to 31 Dec 2026. This row covers all of it, so it can replace it.");
  });

  it("asks for different dates when nothing can settle it", () => {
    expect(overlapMessage(clash, null)).toBe("Overlaps a row valid 01 Oct 2026 to 31 Dec 2026. Change one of the two so the dates don't overlap.");
  });
});

describe("resolutionLabel", () => {
  it("names the date each button will use", () => {
    const next = range("2026-11-20", "2027-06-30");
    expect(resolutionLabel("end-early", next)).toBe("End that row on 19 Nov 2026 and save this one");
    expect(resolutionLabel("start-later", next)).toBe("Start that row on 01 Jul 2027 and save this one");
    expect(resolutionLabel("replace", next)).toBe("Replace that row with this one");
  });
});
