import { describe, expect, it } from "vitest";
import { canAccessPath } from "./access";

describe("canAccessPath", () => {
  it("lets anyone open public pages", () => {
    expect(canAccessPath("/cars/model-h", undefined)).toBe(true);
    expect(canAccessPath("/used-cars", "BUYER")).toBe(true);
  });

  it("keeps signed-out visitors out of staff areas", () => {
    expect(canAccessPath("/consultant", undefined)).toBe(false);
    expect(canAccessPath("/admin/prices", undefined)).toBe(false);
  });

  it("lets consultants into the inbox but not the admin", () => {
    expect(canAccessPath("/consultant/leads/abc", "CONSULTANT")).toBe(true);
    expect(canAccessPath("/admin", "CONSULTANT")).toBe(false);
  });

  it("lets admins into both staff areas", () => {
    expect(canAccessPath("/admin/prices", "ADMIN")).toBe(true);
    expect(canAccessPath("/consultant", "ADMIN")).toBe(true);
  });

  it("keeps buyers out of staff areas", () => {
    expect(canAccessPath("/consultant", "BUYER")).toBe(false);
    expect(canAccessPath("/admin", "BUYER")).toBe(false);
  });

  it("matches whole path segments only", () => {
    expect(canAccessPath("/administration-fees", undefined)).toBe(true);
  });
});
