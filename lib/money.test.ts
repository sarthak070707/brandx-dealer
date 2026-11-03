import { describe, expect, it } from "vitest";
import { formatRupees } from "./money";

describe("formatRupees", () => {
  it("uses Indian digit grouping", () => {
    expect(formatRupees(1_245_000_00)).toBe("₹12,45,000");
    expect(formatRupees(5_60_000_00)).toBe("₹5,60,000");
  });

  it("rounds paise to whole rupees", () => {
    expect(formatRupees(10_049)).toBe("₹100");
    expect(formatRupees(10_050)).toBe("₹101");
  });
});
