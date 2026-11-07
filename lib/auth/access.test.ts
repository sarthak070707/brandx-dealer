import { describe, expect, it } from "vitest";
import { canAccessPath, isStaffArea } from "./access";

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

describe("isStaffArea", () => {
  it("is true for the staff areas and their pages, and false for public pages in either language", () => {
    for (const path of ["/admin", "/admin/prices/road-tax", "/consultant", "/consultant/leads/abc"]) expect(isStaffArea(path), path).toBe(true);
    for (const path of ["/", "/en", "/hi/cars", "/en/sign-in", "/administrator", "/consultants"]) expect(isStaffArea(path), path).toBe(false);
  });
});
