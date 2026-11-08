import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// The seed starts by clearing every table, so running it again always gives the same sample data. A table
// added later and forgotten here makes the seed crash for anyone who has used it (a booking still points
// at a lead), so this fails the moment a model is missing from the list.
describe("the seed", () => {
  const models = [...read("prisma/schema.prisma").matchAll(/^model (\w+) \{/gm)].map((match) => match[1]);
  const seed = read("prisma/seed.ts");

  it("finds the models, so this test can't pass by checking nothing", () => {
    expect(models.length).toBeGreaterThan(15);
  });

  it.each(models)("clears the %s table", (model) => {
    const delegate = model[0].toLowerCase() + model.slice(1);
    expect(seed, `prisma/seed.ts never calls db.${delegate}.deleteMany()`).toContain(`db.${delegate}.deleteMany()`);
  });

  it("clears the tables that point at leads before the leads themselves", () => {
    const position = (model: string) => seed.indexOf(`db.${model}.deleteMany()`);
    for (const dependent of ["testDriveBooking", "serviceBooking", "leadEvent", "outboxMessage", "aiDraft"]) {
      expect(position(dependent), dependent).toBeGreaterThan(-1);
      expect(position(dependent), `${dependent} must be cleared before lead`).toBeLessThan(position("lead"));
    }
  });
});
