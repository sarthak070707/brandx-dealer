import { describe, expect, it } from "vitest";
import { createOptOutToken, readOptOutToken } from "./token";

const SECRET = "test-secret";

describe("opt-out token", () => {
  it("gives back the lead it was made for", () => {
    expect(readOptOutToken(createOptOutToken("lead-123", SECRET), SECRET)).toBe("lead-123");
  });

  it("is different for each lead", () => {
    expect(createOptOutToken("lead-1", SECRET)).not.toBe(createOptOutToken("lead-2", SECRET));
  });

  it("refuses a token for another lead, with the signature kept", () => {
    const signature = createOptOutToken("lead-1", SECRET).split(".")[1];
    expect(readOptOutToken(`lead-2.${signature}`, SECRET)).toBeNull();
  });

  it("refuses a token signed with a different secret", () => {
    expect(readOptOutToken(createOptOutToken("lead-1", "other-secret"), SECRET)).toBeNull();
  });

  it("refuses junk without failing", () => {
    for (const token of ["", "nodot", ".sig", "lead-1.", "lead-1.short", "a.b.c"]) expect(readOptOutToken(token, SECRET), token).toBeNull();
  });

  it("survives being put in a link and read back", () => {
    const token = createOptOutToken("lead-1", SECRET);
    expect(readOptOutToken(decodeURIComponent(encodeURIComponent(token)), SECRET)).toBe("lead-1");
  });
});
