import { describe, expect, it } from "vitest";
import { acknowledgement, optOutNotice } from "./acknowledgement";

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

  it("ends with a way to stop messages when given a link, in either language", () => {
    const url = "https://brandx.example/stop-messages?token=abc";
    expect(acknowledgement({ ...base, language: "EN", consultantName: "Rohan Verma", optOutUrl: url })).toMatch(
      /will call you shortly\. To stop messages from us, open https:\/\/brandx\.example\/stop-messages\?token=abc$/,
    );
    expect(acknowledgement({ ...base, language: "HI", consultantName: null, optOutUrl: url }).endsWith(url)).toBe(true);
  });

  it("has no opt-out line when no link is given", () => {
    expect(acknowledgement({ ...base, language: "EN", consultantName: null })).not.toContain("stop messages");
  });
});

describe("optOutNotice", () => {
  it("puts the link last so punctuation never breaks it", () => {
    expect(optOutNotice("EN", "https://x.example/s").endsWith("https://x.example/s")).toBe(true);
    expect(optOutNotice("HI", "https://x.example/s").endsWith("https://x.example/s")).toBe(true);
  });
});
