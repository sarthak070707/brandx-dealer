import { describe, expect, it } from "vitest";
import { aiOutputSchema } from "./schema";
import { MAX_DRAFT_WORDS, wordCount } from "./words";

const valid = {
  summary: ["Wants a ZX automatic", "Asked about white"],
  intent: "price_quote",
  missing_info: ["Budget"],
  confidence: "high",
  reply_draft: "Hi {{name}}, thanks for writing.",
};

describe("aiOutputSchema", () => {
  it("accepts a complete answer", () => {
    expect(aiOutputSchema.safeParse(valid).success).toBe(true);
  });

  it("refuses a missing field, an unknown intent or an unknown confidence", () => {
    const { reply_draft, ...withoutDraft } = valid;
    expect(reply_draft).toBeTruthy();
    expect(aiOutputSchema.safeParse(withoutDraft).success).toBe(false);
    expect(aiOutputSchema.safeParse({ ...valid, intent: "complaint" }).success).toBe(false);
    expect(aiOutputSchema.safeParse({ ...valid, confidence: "certain" }).success).toBe(false);
  });

  it("wants at least one summary point, and keeps only the first three", () => {
    expect(aiOutputSchema.safeParse({ ...valid, summary: [] }).success).toBe(false);
    expect(aiOutputSchema.parse({ ...valid, summary: ["One"] }).summary).toEqual(["One"]);
    expect(aiOutputSchema.parse({ ...valid, summary: ["a", "b", "c", "d"] }).summary).toEqual(["a", "b", "c"]);
  });

  it("refuses a reply over the word limit", () => {
    const long = Array.from({ length: MAX_DRAFT_WORDS + 1 }, () => "word").join(" ");
    expect(aiOutputSchema.safeParse({ ...valid, reply_draft: long }).success).toBe(false);
    expect(aiOutputSchema.safeParse({ ...valid, reply_draft: long.split(" ").slice(1).join(" ") }).success).toBe(true);
  });
});

describe("wordCount", () => {
  it("counts words in English and Hindi", () => {
    expect(wordCount("  Hello   there  ")).toBe(2);
    expect(wordCount("नमस्ते आशा जी")).toBe(3);
    expect(wordCount("")).toBe(0);
  });
});
