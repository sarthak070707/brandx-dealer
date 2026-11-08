import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEMO_ADMIN_EMAIL, DEMO_PASSWORD, showDemoLogins } from "./demo-logins";

describe("showDemoLogins", () => {
  it("shows the box unless the setting is false, so nothing needs configuring to see it", () => {
    for (const setting of [undefined, "", "true", "TRUE", "yes", "1"]) expect(showDemoLogins(setting), String(setting)).toBe(true);
  });

  it("hides it for false, in any capitals and with stray spaces", () => {
    for (const setting of ["false", "FALSE", "False", "  false "]) expect(showDemoLogins(setting), setting).toBe(false);
  });
});

describe("the logins on show", () => {
  const seed = readFileSync(new URL("../prisma/seed-data.ts", import.meta.url), "utf8");

  it("are the ones the seed really creates", () => {
    expect(seed).toContain(DEMO_ADMIN_EMAIL);
    expect(seed).toMatch(/DEMO_PASSWORD/);
    expect(seed).not.toContain(`"${DEMO_PASSWORD}"`); // the seed takes the password from here, not its own copy
  });
});
