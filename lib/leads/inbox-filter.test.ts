import { describe, expect, it } from "vitest";
import {
  inboxFilterCount,
  matchesInboxFilters,
  NO_INBOX_FILTERS,
  sortInbox,
  UNASSIGNED,
  type InboxLead,
} from "./inbox-filter";

// Tuesday 3 Nov 2026, 15:00 IST.
const NOW = new Date("2026-11-03T09:30:00Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000);

function lead(overrides: Partial<InboxLead>): InboxLead {
  return {
    id: "l",
    buyerName: "Asha",
    source: "ENQUIRY",
    status: "NEW",
    createdAt: hoursAgo(1),
    firstContactAt: null,
    showroomId: "gomti",
    showroomName: "Gomti Nagar",
    assignedToId: "rohan",
    consultantName: "Rohan Verma",
    carLabel: "Model H ZX",
    ...overrides,
  };
}

describe("matchesInboxFilters", () => {
  it("matches everything when no filter is set", () => {
    expect(matchesInboxFilters(lead({}), NO_INBOX_FILTERS, NOW)).toBe(true);
  });

  it("treats a ticked list as 'any of' and combines groups with 'and'", () => {
    const filters = { ...NO_INBOX_FILTERS, statuses: ["NEW" as const, "CONTACTED" as const], sources: ["TEST_DRIVE" as const] };
    expect(matchesInboxFilters(lead({ source: "TEST_DRIVE", status: "CONTACTED" }), filters, NOW)).toBe(true);
    expect(matchesInboxFilters(lead({ source: "ENQUIRY", status: "CONTACTED" }), filters, NOW)).toBe(false);
    expect(matchesInboxFilters(lead({ source: "TEST_DRIVE", status: "WON" }), filters, NOW)).toBe(false);
  });

  it("finds the lead desk queue by the unassigned value", () => {
    const filters = { ...NO_INBOX_FILTERS, consultantIds: [UNASSIGNED] };
    expect(matchesInboxFilters(lead({ assignedToId: null, consultantName: null }), filters, NOW)).toBe(true);
    expect(matchesInboxFilters(lead({}), filters, NOW)).toBe(false);
  });

  it("filters by showroom", () => {
    const filters = { ...NO_INBOX_FILTERS, showroomIds: ["alambagh"] };
    expect(matchesInboxFilters(lead({ showroomId: "alambagh" }), filters, NOW)).toBe(true);
    expect(matchesInboxFilters(lead({}), filters, NOW)).toBe(false);
  });

  it("filters by how recently the lead was created, counting 'today' in IST", () => {
    const today = { ...NO_INBOX_FILTERS, created: "today" as const };
    expect(matchesInboxFilters(lead({ createdAt: hoursAgo(4) }), today, NOW)).toBe(true);
    expect(matchesInboxFilters(lead({ createdAt: hoursAgo(20) }), today, NOW)).toBe(false);
    const week = { ...NO_INBOX_FILTERS, created: "7d" as const };
    expect(matchesInboxFilters(lead({ createdAt: hoursAgo(24 * 6) }), week, NOW)).toBe(true);
    expect(matchesInboxFilters(lead({ createdAt: hoursAgo(24 * 8) }), week, NOW)).toBe(false);
  });
});

describe("sortInbox", () => {
  it("puts leads awaiting a first call first, longest-waiting on top, then the rest newest first", () => {
    const sorted = sortInbox([
      lead({ id: "won-old", status: "WON", createdAt: hoursAgo(90), firstContactAt: hoursAgo(89) }),
      lead({ id: "new-recent", createdAt: hoursAgo(1) }),
      lead({ id: "contacted", status: "CONTACTED", createdAt: hoursAgo(5), firstContactAt: hoursAgo(4) }),
      lead({ id: "new-oldest", createdAt: hoursAgo(3) }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["new-oldest", "new-recent", "contacted", "won-old"]);
  });
});

describe("inboxFilterCount", () => {
  it("counts every ticked option and a set date range", () => {
    expect(inboxFilterCount(NO_INBOX_FILTERS)).toBe(0);
    expect(inboxFilterCount({ ...NO_INBOX_FILTERS, statuses: ["NEW", "LOST"], created: "7d" })).toBe(3);
  });
});
