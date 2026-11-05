import { z } from "zod";
import { Fuel } from "@/generated/prisma/enums";
import { dateField, optionalRupeesField, percentField, positiveRupeesField, rupeesField } from "@/lib/admin/parse";

const id = z.string().nullable();
const choose = (what: string) => z.string().min(1, `Choose a ${what}`);
const validity = { validFrom: dateField, validTo: dateField };

const endsAfterStart = (row: { validFrom: Date; validTo: Date }) => row.validFrom <= row.validTo;
const ORDER_ISSUE = { message: "Valid to can't be before valid from", path: ["validTo"] };

export const exShowroomSchema = z
  .object({ id, variantId: choose("variant"), exShowroom: positiveRupeesField, ...validity })
  .refine(endsAfterStart, ORDER_ISSUE);

export const roadTaxSchema = z
  .object({ id, cityId: choose("city"), fuel: z.enum(Fuel, "Choose a fuel"), slabMin: rupeesField, slabMax: optionalRupeesField, rate: percentField, ...validity })
  .refine(endsAfterStart, ORDER_ISSUE)
  .refine((row) => row.slabMax === null || row.slabMax > row.slabMin, { message: "The upper limit must be above the lower limit", path: ["slabMax"] });

export const insuranceSchema = z
  .object({ id, variantId: choose("variant"), cityId: choose("city"), premium: positiveRupeesField, ...validity })
  .refine(endsAfterStart, ORDER_ISSUE);

const itemList = z
  .string()
  .transform((text) => text.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(z.string().max(40, "Keep each item under 40 characters")).min(1, "List at least one item").max(10, "List at most 10 items"));

export const accessorySchema = z
  .object({ id, modelId: choose("model"), name: z.string().trim().min(2, "Enter a name").max(60), price: rupeesField, items: itemList, ...validity })
  .refine(endsAfterStart, ORDER_ISSUE);
