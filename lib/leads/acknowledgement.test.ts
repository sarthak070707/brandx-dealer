import { describe, expect, it } from "vitest";
import { acknowledgement } from "./acknowledgement";

const base = { buyerName: "Asha", carLabel: "Model H ZX", showroomName: "Gomti Nagar" };

describe("acknowledgement", () => {
  it("names the consultant and showroom in the buyer's language", () => {
    expect(acknowledgement({ ...base, language: "EN", consultantName: "Rohan Verma" })).toBe(
      "Hi Asha, thanks for your interest in the Model H ZX. Rohan Verma at Brand X Gomti Nagar will call you shortly.",
    );
    expect(acknowledgement({ ...base, language: "HI", consultantName: "Rohan Verma" })).toContain("Rohan Verma");
  });

  it("falls back to the team when the lead is waiting at the lead desk", () => {
    expect(acknowledgement({ ...base, language: "EN", consultantName: null })).toContain("Our team at Brand X");
  });
});
