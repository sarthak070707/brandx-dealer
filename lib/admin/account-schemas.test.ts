import { describe, expect, it } from "vitest";
import { accountSchema } from "./account-schemas";

const consultant = { id: null, name: "Neha Gupta", email: "  Neha@BrandX.example ", role: "CONSULTANT", showroomId: "s1", modelIds: ["m1", "m2"], active: true };
const messagesOf = (result: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((result.error?.issues ?? []).map((issue) => [String(issue.path[0]), issue.message]));

describe("accountSchema", () => {
  it("accepts a consultant and tidies the email", () => {
    expect(accountSchema.parse(consultant)).toMatchObject({ email: "neha@brandx.example", name: "Neha Gupta" });
  });

  it("needs a showroom and at least one model for a consultant", () => {
    expect(messagesOf(accountSchema.safeParse({ ...consultant, showroomId: "", modelIds: [] }))).toEqual({
      showroomId: "Choose a showroom",
      modelIds: "Choose at least one model",
    });
  });

  it("does not need a showroom or models for an admin", () => {
    expect(accountSchema.safeParse({ ...consultant, role: "ADMIN", showroomId: "", modelIds: [] }).success).toBe(true);
  });

  it("refuses a bad email, a one-letter name and a role that is not staff", () => {
    expect(messagesOf(accountSchema.safeParse({ ...consultant, email: "not-an-email" }))).toHaveProperty("email");
    expect(messagesOf(accountSchema.safeParse({ ...consultant, name: "N" }))).toHaveProperty("name");
    expect(messagesOf(accountSchema.safeParse({ ...consultant, role: "BUYER" }))).toHaveProperty("role");
  });
});
