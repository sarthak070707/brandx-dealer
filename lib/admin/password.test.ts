import { describe, expect, it } from "vitest";
import { generateTemporaryPassword } from "./password";

describe("generateTemporaryPassword", () => {
  it("is 12 characters with no look-alike characters", () => {
    for (let run = 0; run < 50; run++) {
      const password = generateTemporaryPassword();
      expect(password).toHaveLength(12);
      expect(password).toMatch(/^[a-hj-km-np-zA-HJ-KM-NP-Z2-9]+$/);
    }
  });

  it("uses the random source it is given, across the whole alphabet", () => {
    expect(generateTemporaryPassword(() => 0)).toBe("a".repeat(12));
    const last = generateTemporaryPassword((max) => max - 1);
    expect(last).toBe("9".repeat(12));
  });

  it("gives a different password each time", () => {
    expect(generateTemporaryPassword()).not.toBe(generateTemporaryPassword());
  });
});
