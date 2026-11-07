import { describe, expect, it } from "vitest";
import { countLeadsByOwner } from "./lead-counts";

const row = (assignedToId: string | null, status: "NEW" | "CONTACTED" | "WON" | "LOST", count: number) => ({
  assignedToId,
  status,
  _count: { _all: count },
});

describe("countLeadsByOwner", () => {
  it("counts every lead and the ones still open, per person", () => {
    const counts = countLeadsByOwner([row("a", "NEW", 2), row("a", "CONTACTED", 1), row("a", "WON", 4), row("b", "LOST", 3)]);
    expect(counts.get("a")).toEqual({ total: 7, open: 3 });
    expect(counts.get("b")).toEqual({ total: 3, open: 0 });
  });

  it("ignores leads nobody holds and people with no leads", () => {
    const counts = countLeadsByOwner([row(null, "NEW", 5)]);
    expect(counts.size).toBe(0);
    expect(counts.get("c")).toBeUndefined();
  });
});
