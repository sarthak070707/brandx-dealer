import { z } from "zod";
import { Fuel, Transmission, UsedCarStatus } from "@/generated/prisma/enums";
import { wholeNumber } from "@/lib/admin/fields";
import { dateField, positiveRupeesField } from "@/lib/admin/parse";
import { INSPECTION_AREAS } from "@/lib/admin/used-car-report";
import { normaliseRegistration, REGISTRATION } from "@/lib/registration";

export { normaliseRegistration };

// A photo is one of the model's own (served from /cars) or one the admin uploaded.
const PHOTO = /^\/(cars\/[a-z0-9-]+\.(webp|jpg|png)|api\/car-photos\/[a-z0-9]{20,32})$/;

const FIRST_YEAR = 2000;

export const usedCarSchema = z
  .object({
    id: z.string().nullable(),
    modelId: z.string().min(1, "Choose a car"),
    showroomId: z.string().min(1, "Choose a showroom"),
    variantName: z.string().trim().min(1, "Name the variant, like VX").max(30, "Keep it under 30 characters"),
    fuel: z.enum(Fuel, "Choose a fuel"),
    transmission: z.enum(Transmission, "Choose a transmission"),
    year: wholeNumber(FIRST_YEAR, 2100),
    km: wholeNumber(0, 999_999),
    owners: wholeNumber(1, 6),
    regNumber: z.string().transform(normaliseRegistration).pipe(z.string().regex(REGISTRATION, "Enter a registration like UP32MN2741")),
    price: positiveRupeesField,
    status: z.enum(UsedCarStatus),
    inspectedOn: dateField,
    score: wholeNumber(0, 100),
    // One result per inspected area, in the order of INSPECTION_AREAS.
    results: z.array(z.enum(["PASS", "ATTENTION"])).length(INSPECTION_AREAS.length),
    photo: z.string().regex(PHOTO, "Choose or upload a photo"),
  })
  .superRefine((car, context) => {
    // Checked when the form is sent, so the newest allowed year moves on with the calendar.
    const newest = new Date().getFullYear() + 1;
    if (car.year > newest) context.addIssue({ code: "custom", path: ["year"], message: `Enter a year from ${FIRST_YEAR} to ${newest}` });
  });

export type UsedCarInput = z.input<typeof usedCarSchema>;
