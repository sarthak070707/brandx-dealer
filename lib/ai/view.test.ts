import { describe, expect, it } from "vitest";
import { toDraftView } from "./view";

const row = {
  id: "d1",
  summaryJson: {
    summary: ["Wants the ZX"],
    intent: "price_quote",
    missingInfo: ["Budget"],
    notice: null,
    removed: [{ kind: "discount", text: "10% off.", reason: "it mentions a discount or an offer" }],
  },
  draftText: "Hi Asha",
  confidence: "MEDIUM" as const,
  usedTemplate: false,
  finalSentText: null,
  sentAt: null,
  createdAt: new Date("2026-11-04T10:00:00Z"),
};

describe("toDraftView", () => {
  it("turns a stored draft into what the screen needs", () => {
    expect(toDraftView(row)).toMatchObject({
      id: "d1",
      confidence: "medium",
      intent: "price_quote",
      draft: "Hi Asha",
      sentText: null,
      removed: [{ kind: "discount" }],
    });
  });

  it("returns nothing for a stored draft it cannot read, instead of showing a broken panel", () => {
    expect(toDraftView({ ...row, summaryJson: { surprise: true } })).toBeNull();
  });
});
