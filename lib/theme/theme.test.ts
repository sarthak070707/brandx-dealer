import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

function tokensIn(selector: string) {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)].map((match) => [match[1], match[2]]));
}

const light = tokensIn(":root");
// The dark theme only overrides some tokens; the rest carry over from the light block.
const themes = { light, dark: { ...light, ...tokensIn(".dark") } };

// [text, background]: all of these are read as body text and need 4.5 to 1 (WCAG AA).
const TEXT_PAIRS = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["primary-foreground", "primary-hover"],
  ["inverse-foreground", "inverse"],
  ["inverse-muted", "inverse"],
  ["status-on-time", "background"],
  ["status-on-time", "card"],
  ["status-due", "background"],
  ["status-due", "card"],
  ["status-overdue", "background"],
  ["status-overdue", "card"],
  ["destructive", "background"],
  ["destructive", "card"],
] as const;

// Controls and focus outlines need 3 to 1 against what they sit on (WCAG 1.4.11).
const CONTROL_PAIRS = [
  ["ring", "background"],
  ["ring", "card"],
  ["primary", "background"],
] as const;

describe.each(Object.entries(themes))("%s theme", (_name, tokens) => {
  it("defines every colour the pairs below use", () => {
    for (const name of new Set([...TEXT_PAIRS, ...CONTROL_PAIRS].flat())) expect(tokens, name).toHaveProperty(name);
  });

  it.each(TEXT_PAIRS)("keeps %s readable on %s (4.5 to 1)", (text, background) => {
    expect(contrastRatio(tokens[text], tokens[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(CONTROL_PAIRS)("keeps %s visible against %s (3 to 1)", (control, background) => {
    expect(contrastRatio(tokens[control], tokens[background])).toBeGreaterThanOrEqual(3);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white, 1 for the same colour, and the same either way round", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#7a7a7a", "#7a7a7a")).toBe(1);
    expect(contrastRatio("#111013", "#eeefe8")).toBeCloseTo(contrastRatio("#eeefe8", "#111013"), 10);
  });
});
