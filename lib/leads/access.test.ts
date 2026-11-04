import { describe, expect, it } from "vitest";
import { leadScope } from "./access";

describe("leadScope", () => {
  it("limits a consultant to the leads assigned to them", () => {
    expect(leadScope({ id: "rohan", role: "CONSULTANT" })).toEqual({ assignedToId: "rohan" });
  });

  it("never gives one consultant the scope of another", () => {
    expect(leadScope({ id: "kabir", role: "CONSULTANT" })).not.toEqual(leadScope({ id: "rohan", role: "CONSULTANT" }));
  });

  it("lets an admin see every lead, including the lead desk queue", () => {
    expect(leadScope({ id: "meera", role: "ADMIN" })).toEqual({});
  });

  it("refuses buyers outright", () => {
    expect(() => leadScope({ id: "riya", role: "BUYER" })).toThrow();
  });
});
