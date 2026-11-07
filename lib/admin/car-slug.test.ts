import { describe, expect, it } from "vitest";
import { slugify, variantCode } from "./car-slug";

describe("slugify", () => {
  it("makes an address from a car's name", () => {
    expect(slugify("Model Z")).toBe("model-z");
    expect(slugify("  Aurora  GT!! ")).toBe("aurora-gt");
    expect(slugify("Model-R (2027)")).toBe("model-r-2027");
  });

  it("gives nothing for a name with no letters or digits, so it can be refused", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("लखनऊ")).toBe("");
  });

  it("keeps the address short and never ends it with a dash", () => {
    const slug = slugify("A very long name for a car that goes on and on and on forever");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("variantCode", () => {
  it("follows the existing NEW-H-01 pattern", () => {
    expect(variantCode("model-h", 1)).toBe("NEW-H-01");
    expect(variantCode("model-z", 12)).toBe("NEW-Z-12");
  });

  it("uses the whole address for a name that does not start with Model", () => {
    expect(variantCode("aurora-gt", 2)).toBe("NEW-AURORA-GT-02");
  });
});
