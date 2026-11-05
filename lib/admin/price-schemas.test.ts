import { describe, expect, it } from "vitest";
import { accessorySchema, exShowroomSchema, insuranceSchema, roadTaxSchema } from "./price-schemas";

const dates = { validFrom: "2026-10-01", validTo: "2026-12-31" };
const messagesOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((result.error?.issues ?? []).map((issue) => [String(issue.path[0]), issue.message]));

describe("exShowroomSchema", () => {
  const valid = { id: null, variantId: "v1", exShowroom: "12,45,000", ...dates };

  it("turns the typed row into paise and dates", () => {
    expect(exShowroomSchema.parse(valid)).toMatchObject({ exShowroom: 124_500_000, validFrom: new Date("2026-10-01T00:00:00Z") });
  });

  it("points at the field that is wrong", () => {
    expect(messagesOf(exShowroomSchema.safeParse({ ...valid, variantId: "" }))).toHaveProperty("variantId");
    expect(messagesOf(exShowroomSchema.safeParse({ ...valid, exShowroom: "0" }))).toHaveProperty("exShowroom");
    expect(messagesOf(exShowroomSchema.safeParse({ ...valid, validTo: "2026-09-30" }))).toEqual({ validTo: "Valid to can't be before valid from" });
  });
});

describe("roadTaxSchema", () => {
  const valid = { id: "r1", cityId: "c1", fuel: "PETROL", slabMin: "10,00,000", slabMax: "", rate: "10", ...dates };

  it("reads an open-ended slab and the rate in basis points", () => {
    expect(roadTaxSchema.parse(valid)).toMatchObject({ slabMin: 100_000_000, slabMax: null, rate: 1_000, fuel: "PETROL" });
  });

  it("refuses an upper limit that is not above the lower limit", () => {
    expect(messagesOf(roadTaxSchema.safeParse({ ...valid, slabMax: "10,00,000" }))).toHaveProperty("slabMax");
    expect(messagesOf(roadTaxSchema.safeParse({ ...valid, slabMax: "5,00,000" }))).toHaveProperty("slabMax");
  });

  it("refuses a rate over 100% and an unknown fuel", () => {
    expect(messagesOf(roadTaxSchema.safeParse({ ...valid, rate: "120" }))).toHaveProperty("rate");
    expect(messagesOf(roadTaxSchema.safeParse({ ...valid, fuel: "STEAM" }))).toHaveProperty("fuel");
  });
});

describe("insuranceSchema", () => {
  it("needs a variant, a city and a premium above zero", () => {
    const valid = { id: null, variantId: "v1", cityId: "c1", premium: "52,000", ...dates };
    expect(insuranceSchema.parse(valid).premium).toBe(5_200_000);
    expect(Object.keys(messagesOf(insuranceSchema.safeParse({ ...valid, variantId: "", cityId: "", premium: "0" })))).toEqual(
      expect.arrayContaining(["variantId", "cityId", "premium"]),
    );
  });
});

describe("accessorySchema", () => {
  const valid = { id: null, modelId: "m1", name: "Urban pack", price: "18,000", items: "Floor mats, Mud flaps,\nDash camera", ...dates };

  it("splits the items on commas and new lines", () => {
    expect(accessorySchema.parse(valid)).toMatchObject({ price: 1_800_000, items: ["Floor mats", "Mud flaps", "Dash camera"] });
  });

  it("needs at least one item and a name", () => {
    expect(messagesOf(accessorySchema.safeParse({ ...valid, items: " , " }))).toHaveProperty("items");
    expect(messagesOf(accessorySchema.safeParse({ ...valid, name: "A" }))).toHaveProperty("name");
  });
});
