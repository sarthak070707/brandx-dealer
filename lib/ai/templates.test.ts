import { describe, expect, it } from "vitest";
import { fillPlaceholders, templateReply } from "./templates";

const names = { name: "Asha", consultant: "Rohan Verma", showroom: "Gomti Nagar" };

describe("fillPlaceholders", () => {
  it("fills the buyer, consultant and showroom", () => {
    expect(fillPlaceholders("Hi {{name}}, I am {{consultant}} at {{showroom}}.", names, "EN")).toBe(
      "Hi Asha, I am Rohan Verma at Gomti Nagar.",
    );
  });

  it("refers to the team when the lead is waiting at the lead desk", () => {
    expect(fillPlaceholders("{{consultant}} will call.", { ...names, consultant: null }, "EN")).toBe("our team will call.");
    expect(fillPlaceholders("{{consultant}} कॉल करेंगे।", { ...names, consultant: null }, "HI")).toBe("हमारी टीम कॉल करेंगे।");
  });

  it("drops a placeholder the model invented, rather than showing it", () => {
    expect(fillPlaceholders("Hi {{name}} {{phone}}, welcome.", names, "EN")).toBe("Hi Asha, welcome.");
  });

  it("allows spaces inside the braces", () => {
    expect(fillPlaceholders("Hi {{ name }}", names, "EN")).toBe("Hi Asha");
  });
});

describe("templateReply", () => {
  it("has a standard and a clarifying reply in both languages, with no price in any", () => {
    for (const language of ["EN", "HI"] as const) {
      for (const kind of ["standard", "clarifying"] as const) {
        const text = fillPlaceholders(templateReply(language, kind), names, language);
        expect(text).toContain("Asha");
        expect(text).not.toMatch(/₹|\d{4,}/);
        expect(text).not.toContain("{{");
      }
    }
  });
});
