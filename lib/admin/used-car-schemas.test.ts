import { describe, expect, it } from "vitest";
import { pathErrorsOf } from "./field-errors";
import { normaliseRegistration, usedCarSchema } from "./used-car-schemas";

const valid = {
  id: null,
  modelId: "m1",
  showroomId: "s1",
  variantName: "VX",
  fuel: "PETROL",
  transmission: "MANUAL",
  year: "2022",
  km: "41,200".replace(",", ""),
  owners: "1",
  regNumber: " up32 mn-2741 ",
  price: "8,45,000",
  status: "AVAILABLE",
  inspectedOn: "2026-11-03",
  score: "92",
  results: ["PASS", "PASS", "PASS", "PASS", "PASS", "PASS"],
  photo: "/cars/model-c-teal.webp",
};
const errorsFor = (input: unknown) => {
  const result = usedCarSchema.safeParse(input);
  return result.success ? {} : pathErrorsOf(result.error);
};

describe("usedCarSchema", () => {
  it("accepts a complete car and tidies the registration, price and numbers", () => {
    const parsed = usedCarSchema.parse(valid);
    expect(parsed).toMatchObject({ regNumber: "UP32MN2741", price: 84_500_000, year: 2022, km: 41_200, owners: 1, score: 92 });
    expect(parsed.inspectedOn.toISOString().slice(0, 10)).toBe("2026-11-03");
  });

  it("accepts a stored photo and an uploaded one, and nothing else", () => {
    expect(errorsFor({ ...valid, photo: "/api/car-photos/cmw5aaaaaaaaaaaaaaaaaaaaa" })).toEqual({});
    for (const photo of ["", "https://evil.example/x.png", "/cars/../secret.png", "/cars/x.svg", "/api/car-photos/short"]) {
      expect(errorsFor({ ...valid, photo }).photo, photo).toBe("Choose or upload a photo");
    }
  });

  it("refuses a registration that is not an Indian plate", () => {
    for (const regNumber of ["", "1234", "UP32", "UP3MN2741", "UP32MNOP2741", "UP32MN27"]) {
      expect(errorsFor({ ...valid, regNumber }).regNumber, regNumber).toBe("Enter a registration like UP32MN2741");
    }
    expect(errorsFor({ ...valid, regNumber: "UP78HJ5530" })).toEqual({});
  });

  it("names every problem next to its field", () => {
    const errors = errorsFor({ ...valid, modelId: "", showroomId: "", variantName: "", year: "1990", km: "abc", owners: "0", price: "0", score: "101", results: ["PASS"] });
    expect(errors).toMatchObject({
      modelId: "Choose a car",
      showroomId: "Choose a showroom",
      variantName: "Name the variant, like VX",
      year: "Enter a whole number from 2000 to 2100",
      km: "Enter a whole number from 0 to 999999",
      owners: "Enter a whole number from 1 to 6",
      score: "Enter a whole number from 0 to 100",
    });
    expect(errors.price).toBeTruthy();
    expect(errors.results).toBeTruthy();
  });

  it("does not allow a model year more than one year ahead", () => {
    const thisYear = new Date().getFullYear();
    expect(errorsFor({ ...valid, year: String(thisYear + 1) })).toEqual({});
    expect(errorsFor({ ...valid, year: String(thisYear + 2) }).year).toBe(`Enter a year from 2000 to ${thisYear + 1}`);
  });
});

describe("normaliseRegistration", () => {
  it("removes spaces and dashes and capitalises", () => {
    expect(normaliseRegistration(" up32-mn 2741 ")).toBe("UP32MN2741");
  });
});
