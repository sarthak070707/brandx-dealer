import { describe, expect, it } from "vitest";
import { describeEvent, referencedUserIds } from "./events";

const names = new Map([
  ["rohan", "Rohan Verma"],
  ["priya", "Priya Tiwari"],
]);

describe("describeEvent", () => {
  it("describes automatic assignment and the lead desk fallback", () => {
    expect(describeEvent({ type: "ASSIGNED", details: { reason: "auto", toUserId: "rohan" } }, names)).toBe(
      "Assigned to Rohan Verma automatically",
    );
    expect(describeEvent({ type: "ASSIGNED", details: { reason: "no-eligible-consultant", toUserId: null } }, names)).toContain(
      "lead desk",
    );
  });

  it("describes a re-assignment with its reason, including from the lead desk", () => {
    expect(
      describeEvent({ type: "REASSIGNED", details: { fromUserId: "rohan", toUserId: "priya", reason: "On leave" } }, names),
    ).toBe("Re-assigned from Rohan Verma to Priya Tiwari: On leave");
    expect(
      describeEvent({ type: "REASSIGNED", details: { fromUserId: null, toUserId: "priya", reason: "Cover" } }, names),
    ).toBe("Re-assigned from the lead desk to Priya Tiwari: Cover");
  });

  it("describes status changes, adding why a lead was lost", () => {
    expect(describeEvent({ type: "STATUS", details: { from: "NEW", to: "CONTACTED" } }, names)).toBe(
      "Status changed from New to Contacted",
    );
    expect(describeEvent({ type: "STATUS", details: { from: "CONTACTED", to: "LOST", lostReason: "Bought elsewhere" } }, names)).toBe(
      "Status changed from Contacted to Lost: Bought elsewhere",
    );
  });

  it("describes notes and the simulated acknowledgement", () => {
    expect(describeEvent({ type: "NOTE", details: { note: "Buyer cancelled the test drive" } }, names)).toBe(
      "Buyer cancelled the test drive",
    );
    expect(describeEvent({ type: "MESSAGE", details: { channel: "WHATSAPP", simulated: true } }, names)).toBe(
      "Acknowledgement sent on WhatsApp (simulated)",
    );
  });

  it("tells a reply from the acknowledgement", () => {
    expect(describeEvent({ type: "MESSAGE", details: { channel: "WHATSAPP", simulated: true, kind: "reply" } }, names)).toBe(
      "Reply sent on WhatsApp (simulated)",
    );
  });

  it("names a consultant who no longer exists without failing", () => {
    expect(describeEvent({ type: "ASSIGNED", details: { reason: "auto", toUserId: "gone" } }, names)).toBe(
      "Assigned to a former consultant automatically",
    );
  });

  it("falls back to a neutral line for details it does not recognise", () => {
    expect(describeEvent({ type: "STATUS", details: { surprise: true } }, names)).toBe("Update recorded");
  });
});

describe("referencedUserIds", () => {
  it("collects each consultant named in the history once", () => {
    const ids = referencedUserIds([
      { type: "ASSIGNED", details: { reason: "auto", toUserId: "rohan" } },
      { type: "REASSIGNED", details: { fromUserId: "rohan", toUserId: "priya", reason: "x" } },
      { type: "NOTE", details: { note: "hello" } },
    ]);
    expect(ids.toSorted()).toEqual(["priya", "rohan"]);
  });
});
