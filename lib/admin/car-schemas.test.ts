import { describe, expect, it } from "vitest";
import { pathErrorsOf } from "./field-errors";
import { carSchema, variantSchema } from "./car-schemas";

const PHOTO_A = "/api/car-photos/cmw5aaaaaaaaaaaaaaaaaaaaa";
const PHOTO_B = "/api/car-photos/cmw5bbbbbbbbbbbbbbbbbbbbb";

const variant = {
  name: "GX",
  fuel: "PETROL",
  transmission: "MANUAL",
  engine: "1.5 L petrol",
  powerBhp: "119",
  mileageKmpl: "17.2",
  seats: "5",
  bootLitres: "458",
  exShowroom: "12,45,000",
  insurance: "52,000",
};
const car = {
  name: "Model Z",
  bodyType: "SUV",
  description: "A seven-seat SUV with a quiet cabin and a long range.",
  featured: false,
  colours: [
    { name: "Deep Teal", hex: "#1f6f78", photo: PHOTO_A },
    { name: "Pearl White", hex: "#f2f1ec", photo: PHOTO_B },
  ],
  variants: [variant],
  demoShowroomId: "",
};

const errorsFor = (input: unknown) => {
  const result = carSchema.safeParse(input);
  return result.success ? {} : pathErrorsOf(result.error);
};

describe("carSchema", () => {
  it("accepts a complete car and turns the text into numbers and paise", () => {
    const parsed = carSchema.parse(car);
    expect(parsed.variants[0]).toMatchObject({ powerBhp: 119, mileageKmpl: 17.2, seats: 5, bootLitres: 458, exShowroom: 124_500_000, insurance: 5_200_000 });
    expect(parsed.name).toBe("Model Z");
  });

  it("names the field and the position of every problem", () => {
    const errors = errorsFor({
      ...car,
      name: "Z",
      description: "Too short",
      colours: [{ name: "", hex: "teal", photo: "/cars/model-h-1.webp" }],
      variants: [{ ...variant, engine: "", powerBhp: "9", mileageKmpl: "lots", exShowroom: "-5" }],
    });
    expect(errors).toMatchObject({
      name: "Enter the car's name",
      description: "Write a sentence or two, at least 20 characters",
      "colours.0.name": "Name the colour",
      "colours.0.hex": "Pick a colour",
      "colours.0.photo": "Upload a photo",
      "variants.0.engine": "Describe the engine, like 1.5 L petrol",
      "variants.0.powerBhp": "Enter a whole number from 30 to 1500",
      "variants.0.mileageKmpl": "Enter a number from 3 to 60, like 17.5",
    });
    expect(errors["variants.0.exShowroom"]).toBeTruthy();
  });

  it("needs at least one colour and one variant, and no more than six of each", () => {
    expect(errorsFor({ ...car, colours: [] }).colours).toBe("Add at least one colour");
    expect(errorsFor({ ...car, variants: [] }).variants).toBe("Add at least one variant");
    expect(errorsFor({ ...car, variants: Array.from({ length: 7 }, (_, index) => ({ ...variant, name: `V${index}` })) }).variants).toBe("At most 6 variants");
  });

  it("refuses a photo that is not one we stored, so a page can't point at another site", () => {
    expect(errorsFor({ ...car, colours: [{ ...car.colours[0], photo: "https://evil.example/x.png" }] })["colours.0.photo"]).toBe("Upload a photo");
  });

  it("refuses two colours with the same name, and two identical variants", () => {
    expect(errorsFor({ ...car, colours: [car.colours[0], { ...car.colours[1], name: "deep teal" }] })["colours.1.name"]).toBe("Each colour needs its own name");
    expect(errorsFor({ ...car, variants: [variant, { ...variant, exShowroom: "9,00,000" }] })["variants.1.name"]).toBe(
      "Another variant has this name, fuel and transmission",
    );
  });

  it("allows the same variant name with a different fuel or gearbox", () => {
    expect(errorsFor({ ...car, variants: [variant, { ...variant, fuel: "DIESEL" }] })).toEqual({});
  });
});

describe("variantSchema", () => {
  it("keeps prices within what the database can hold", () => {
    expect(variantSchema.safeParse({ ...variant, exShowroom: "3,00,00,000" }).success).toBe(false);
  });
});
