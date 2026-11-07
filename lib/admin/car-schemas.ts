import { z } from "zod";
import { BodyType, Fuel, Transmission } from "@/generated/prisma/enums";
import { photoIdFrom } from "@/lib/admin/car-photos";
import { decimalNumber, wholeNumber } from "@/lib/admin/fields";
import { positiveRupeesField } from "@/lib/admin/parse";

export const colourSchema = z.object({
  name: z.string().trim().min(2, "Name the colour").max(30, "Keep it under 30 characters"),
  hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
  photo: z.string().refine((url) => photoIdFrom(url) !== null, "Upload a photo"),
});

export const variantSchema = z.object({
  name: z.string().trim().min(1, "Name the variant, like VX").max(30, "Keep it under 30 characters"),
  fuel: z.enum(Fuel, "Choose a fuel"),
  transmission: z.enum(Transmission, "Choose a transmission"),
  engine: z.string().trim().min(2, "Describe the engine, like 1.5 L petrol").max(40, "Keep it under 40 characters"),
  powerBhp: wholeNumber(30, 1500),
  mileageKmpl: decimalNumber(3, 60),
  seats: wholeNumber(2, 9),
  bootLitres: wholeNumber(50, 2000),
  exShowroom: positiveRupeesField,
  // The first-year premium, used for every city until it is set city by city in the price tables.
  insurance: positiveRupeesField,
});

export const carSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the car's name").max(40, "Keep it under 40 characters"),
    bodyType: z.enum(BodyType, "Choose a body type"),
    description: z.string().trim().min(20, "Write a sentence or two, at least 20 characters").max(220, "Keep it under 220 characters"),
    featured: z.boolean(),
    colours: z.array(colourSchema).min(1, "Add at least one colour").max(6, "At most 6 colours"),
    variants: z.array(variantSchema).min(1, "Add at least one variant").max(6, "At most 6 variants"),
    // Empty means no demo car; otherwise the showroom that gets one for the first variant.
    demoShowroomId: z.string(),
  })
  .superRefine((car, context) => {
    const seen = new Set<string>();
    car.colours.forEach((colour, index) => {
      const key = colour.name.toLowerCase();
      if (seen.has(key)) context.addIssue({ code: "custom", path: ["colours", index, "name"], message: "Each colour needs its own name" });
      seen.add(key);
    });

    const variants = new Set<string>();
    car.variants.forEach((variant, index) => {
      const key = `${variant.name}|${variant.fuel}|${variant.transmission}`.toLowerCase();
      if (variants.has(key)) {
        context.addIssue({ code: "custom", path: ["variants", index, "name"], message: "Another variant has this name, fuel and transmission" });
      }
      variants.add(key);
    });
  });

export const addVariantSchema = z.object({ modelId: z.string().min(1), variant: variantSchema });

export type CarInput = z.input<typeof carSchema>;
export type VariantInput = z.input<typeof variantSchema>;
