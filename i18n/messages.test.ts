import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import hi from "../messages/hi.json";
import { CLIENT_NAMESPACES, pickClientMessages } from "./client-messages";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [[`${prefix}${key}`, value] as [string, string]] : flatten(value, `${prefix}${key}.`),
  );
}

const english = new Map(flatten(en));
const hindi = new Map(flatten(hi));
const placeholders = (text: string) => [...new Set([...text.matchAll(/\{(\w+)[,}]|<(\w+)>/g)].map((match) => match[1] ?? match[2]))].toSorted();
// Names and symbols that are the same in both languages on purpose.
const SAME_IN_BOTH = [/^Language\./, /^Content\.showrooms\.[\w-]+\.name$/];

describe("message files", () => {
  it("have exactly the same keys in English and Hindi", () => {
    expect([...hindi.keys()].toSorted()).toEqual([...english.keys()].toSorted());
  });

  it("have no empty text", () => {
    for (const [key, text] of [...english, ...hindi]) expect(text.trim(), key).not.toBe("");
  });

  it("use the same placeholders and tags in both languages, so no value goes missing", () => {
    for (const [key, text] of english) expect(placeholders(hindi.get(key) ?? ""), key).toEqual(placeholders(text));
  });

  it("have a Hindi version of every sentence, apart from names that stay the same", () => {
    for (const [key, text] of english) {
      if (SAME_IN_BOTH.some((pattern) => pattern.test(key))) continue;
      expect(hindi.get(key), `${key} is still English`).not.toBe(text);
      expect(hindi.get(key), key).toMatch(/[\u0900-\u097F]/);
    }
  });
});

describe("pickClientMessages", () => {
  it("only names namespaces that exist", () => {
    for (const name of CLIENT_NAMESPACES) expect(name in en, name).toBe(true);
  });

  it("keeps the browser's share small, leaving out server-only pages like Privacy", () => {
    const picked = pickClientMessages(en);
    expect(Object.keys(picked).toSorted()).toEqual([...CLIENT_NAMESPACES].toSorted());
    expect(picked).not.toHaveProperty("Privacy");
    expect(picked).not.toHaveProperty("Home");
  });
});
