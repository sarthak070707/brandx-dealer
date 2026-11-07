import { describe, expect, it } from "vitest";
import type { Complete } from "@/lib/ai/generate";
import { suggestPriceBand } from "./price-band";
import { explainBand, explanationMessages, templateExplanation } from "./price-band-explain";

const rupees = (amount: number) => amount * 100;
const band = suggestPriceBand({ newPricePaise: rupees(10_00_000), year: 2022, currentYear: 2026, km: 40_000, owners: 1, inspectionScore: 85 });
const facts = { carName: "Model C VX", band, newPricePaise: rupees(10_00_000), listedPaise: rupees(8_45_000) };
const reply = (text: unknown): Complete => async () => JSON.stringify({ explanation: text });

describe("templateExplanation", () => {
  it("gives the range, the middle and how the listed price compares", () => {
    expect(templateExplanation(facts)).toBe(
      "The suggested range for the Model C VX is ₹6,00,000 to ₹6,60,000, with ₹6,30,000 in the middle. The listed price of ₹8,45,000 is above this range, so expect it to take longer to sell. It follows the car's age, distance, owners and inspection score.",
    );
  });

  it("describes a price inside the range, a price below it, and no listed price at all", () => {
    expect(templateExplanation({ ...facts, listedPaise: rupees(6_30_000) })).toContain("is inside this range");
    expect(templateExplanation({ ...facts, listedPaise: rupees(5_00_000) })).toContain("is below this range");
    expect(templateExplanation({ ...facts, listedPaise: null })).not.toContain("listed price");
  });
});

describe("explanationMessages", () => {
  it("gives the model the formatted figures to repeat, and forbids any other amount or market talk", () => {
    const [system, user] = explanationMessages(facts);
    expect(system.content).toMatch(/Never write a rupee amount that is not in the facts/);
    expect(user.content).toContain("₹6,30,000");
    expect(user.content).toContain('"listedPriceComparedWithRange":"above"');
  });
});

describe("explainBand", () => {
  it("uses the AI's words when they only repeat the amounts it was given", async () => {
    const text = "At four years old with normal use it keeps about 63% of its new price, so the range is ₹6,00,000 to ₹6,60,000. The listed ₹8,45,000 is above it.";
    expect(await explainBand(facts, reply(text))).toEqual({ text, source: "ai" });
  });

  it("falls back to the standard explanation when the AI mentions an amount it wasn't given", async () => {
    const result = await explainBand(facts, reply("Cars like this usually sell for around ₹7,10,000 in Lucknow."));
    expect(result.source).toBe("template");
    expect(result.text).not.toContain("7,10,000");
  });

  it("falls back when the text is too long, empty, the wrong shape, not JSON, or the request fails", async () => {
    const tooLong = "word ".repeat(120);
    for (const complete of [reply(tooLong), reply(""), reply(42), (async () => "not json at all") as Complete, (async () => { throw new Error("503"); }) as Complete]) {
      expect((await explainBand(facts, complete)).source).toBe("template");
    }
  });

  it("falls back when the AI is too slow, rather than keeping the admin waiting", async () => {
    const never: Complete = (_messages, signal) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
    expect((await explainBand(facts, never, 20)).source).toBe("template");
  });
});
