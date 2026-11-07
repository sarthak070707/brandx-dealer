import { describe, expect, it } from "vitest";
import { contentKey, localised } from "./content";

const messages: Record<string, string> = {
  "colours.deep-teal": "डीप टील",
  "showrooms.alambagh.address": "45 कानपुर रोड",
  "engines.1-2-l-petrol-cng": "1.2 L पेट्रोल + सीएनजी",
};
const t = Object.assign((key: string) => messages[key], { has: (key: string) => key in messages });

describe("contentKey", () => {
  it("turns a database value into a safe message key", () => {
    expect(contentKey("Deep Teal")).toBe("deep-teal");
    expect(contentKey("1.2 L petrol + CNG")).toBe("1-2-l-petrol-cng");
    expect(contentKey("model-h")).toBe("model-h");
    expect(contentKey("  Body & paint! ")).toBe("body-paint");
  });
});

describe("localised", () => {
  it("uses the translation when one exists", () => {
    expect(localised(t, "colours", "Deep Teal", "Deep Teal")).toBe("डीप टील");
    expect(localised(t, "engines", "1.2 L petrol + CNG", "x")).toBe("1.2 L पेट्रोल + सीएनजी");
  });

  it("reads a field of a nested entry", () => {
    expect(localised(t, "showrooms", "Alambagh", "fallback", "address")).toBe("45 कानपुर रोड");
  });

  it("shows the value as entered when there is no translation, such as a colour added later", () => {
    expect(localised(t, "colours", "Sunset Orange", "Sunset Orange")).toBe("Sunset Orange");
    expect(localised(t, "showrooms", "Alambagh", "fallback", "name")).toBe("fallback");
  });
});
