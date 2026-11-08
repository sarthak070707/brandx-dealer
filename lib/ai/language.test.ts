import { describe, expect, it } from "vitest";
import { devanagariShare, languageProblem } from "./language";

const ENGLISH = "Hi {{name}}, the on-road price in Lucknow is ₹14,21,500. {{consultant}}, Brand X {{showroom}}";
const HINDI = "नमस्ते {{name}} जी! Model V GX की ऑन-रोड कीमत ₹13,00,000 है। {{consultant}}, Brand X {{showroom}}";

describe("devanagariShare", () => {
  it("is 0 for English and close to 1 for Hindi, ignoring the {{placeholders}}", () => {
    expect(devanagariShare(ENGLISH)).toBe(0);
    expect(devanagariShare(HINDI)).toBeGreaterThan(0.4);
    expect(devanagariShare("{{name}} {{consultant}}")).toBe(0);
    expect(devanagariShare("")).toBe(0);
  });

  it("counts letters only, so digits, rupee signs and punctuation do not matter", () => {
    expect(devanagariShare("₹14,21,500 !!!")).toBe(0);
    expect(devanagariShare("कार 123 ???")).toBe(1);
  });
});

describe("languageProblem", () => {
  it("accepts English for an English lead and Hindi for a Hindi lead", () => {
    expect(languageProblem(ENGLISH, "EN")).toBeNull();
    expect(languageProblem(HINDI, "HI")).toBeNull();
  });

  it("refuses a Hindi draft for an English lead, and says what to do", () => {
    expect(languageProblem(HINDI, "EN")).toBe("it was not in English: write the reply in English only, with no Hindi words and no Devanagari letters");
  });

  it("refuses an English draft for a Hindi lead", () => {
    expect(languageProblem(ENGLISH, "HI")).toBe("it was not in Hindi: write the reply in Hindi, in Devanagari script");
  });

  it("allows a stray Hindi word in English, but not a Hindi sentence", () => {
    expect(languageProblem("Hi {{name}}, we will call you shortly, ji. We are happy to help you choose the right Model H variant today.", "EN")).toBeNull();
    expect(languageProblem("Hi {{name}}, आपका स्वागत है। Please tell us when you want the car.", "EN")).not.toBeNull();
  });

  it("allows an English product name inside a Hindi reply", () => {
    expect(languageProblem("नमस्ते {{name}} जी, Model H ZX आपके लिए उपलब्ध विकल्पों में से एक है। {{consultant}}", "HI")).toBeNull();
  });
});
