import { describe, expect, it } from "vitest";
import { validateReassign } from "./reassign";

const consultant = { id: "priya", role: "CONSULTANT" as const, active: true };
const rohan = { id: "rohan", role: "CONSULTANT" as const };
const admin = { id: "meera", role: "ADMIN" as const };

describe("validateReassign", () => {
  it("lets the assigned consultant hand a lead on, with a reason", () => {
    expect(validateReassign({ actor: rohan, assignedToId: "rohan", target: consultant, reason: " On leave " })).toEqual({
      ok: true,
      reason: "On leave",
    });
  });

  it("lets an admin assign a lead from the lead desk", () => {
    expect(validateReassign({ actor: admin, assignedToId: null, target: consultant, reason: "Nobody handles it" }).ok).toBe(true);
  });

  it("stops a consultant moving someone else's lead", () => {
    const result = validateReassign({ actor: rohan, assignedToId: "kabir", target: consultant, reason: "Taking it" });
    expect(result.ok).toBe(false);
  });

  it("requires a reason", () => {
    expect(validateReassign({ actor: admin, assignedToId: "rohan", target: consultant, reason: " " }).ok).toBe(false);
  });

  it("refuses inactive consultants, non-consultants and missing users", () => {
    expect(validateReassign({ actor: admin, assignedToId: null, target: { ...consultant, active: false }, reason: "Cover" }).ok).toBe(false);
    expect(validateReassign({ actor: admin, assignedToId: null, target: { ...consultant, role: "ADMIN" }, reason: "Cover" }).ok).toBe(false);
    expect(validateReassign({ actor: admin, assignedToId: null, target: null, reason: "Cover" }).ok).toBe(false);
  });

  it("refuses moving a lead to the consultant who already has it", () => {
    expect(validateReassign({ actor: admin, assignedToId: "priya", target: consultant, reason: "Cover" }).ok).toBe(false);
  });
});
