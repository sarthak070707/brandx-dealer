import { describe, expect, it } from "vitest";
import { pickConsultant } from "./assign";

const at = (iso: string) => new Date(iso);

describe("pickConsultant", () => {
  it("picks the consultant with the fewest open leads", () => {
    expect(
      pickConsultant([
        { id: "rohan", openLeads: 4, lastAssignedAt: at("2026-11-01T10:00:00Z") },
        { id: "priya", openLeads: 2, lastAssignedAt: at("2026-11-03T10:00:00Z") },
      ]),
    ).toBe("priya");
  });

  it("breaks a tie by who was assigned longest ago", () => {
    expect(
      pickConsultant([
        { id: "rohan", openLeads: 2, lastAssignedAt: at("2026-11-03T10:00:00Z") },
        { id: "priya", openLeads: 2, lastAssignedAt: at("2026-11-01T10:00:00Z") },
      ]),
    ).toBe("priya");
  });

  it("treats a consultant who was never assigned as waiting longest", () => {
    expect(
      pickConsultant([
        { id: "rohan", openLeads: 0, lastAssignedAt: at("2026-11-01T10:00:00Z") },
        { id: "new-hire", openLeads: 0, lastAssignedAt: null },
      ]),
    ).toBe("new-hire");
  });

  it("returns null when nobody is eligible, so the lead goes to the lead desk", () => {
    expect(pickConsultant([])).toBeNull();
  });
});
