import { describe, expect, it } from "vitest";
import { validateAccountChange } from "./account-rules";

const admin = { role: "ADMIN" as const, active: true };
const consultant = { role: "CONSULTANT" as const, active: true };

describe("validateAccountChange", () => {
  it("lets an admin change anyone else, including demoting or deactivating them", () => {
    expect(validateAccountChange({ actorId: "a", targetId: "b", current: admin, next: consultant })).toBeNull();
    expect(validateAccountChange({ actorId: "a", targetId: "b", current: consultant, next: { ...consultant, active: false } })).toBeNull();
  });

  it("stops an admin removing their own admin role", () => {
    expect(validateAccountChange({ actorId: "a", targetId: "a", current: admin, next: consultant })).toBe("You can't remove your own admin role.");
  });

  it("stops an admin deactivating their own account", () => {
    expect(validateAccountChange({ actorId: "a", targetId: "a", current: admin, next: { ...admin, active: false } })).toBe(
      "You can't deactivate your own account.",
    );
  });

  it("lets an admin edit their own name or details while staying active", () => {
    expect(validateAccountChange({ actorId: "a", targetId: "a", current: admin, next: admin })).toBeNull();
  });
});
