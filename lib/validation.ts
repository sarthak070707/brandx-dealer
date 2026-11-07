import { z } from "zod";

// Indian mobile numbers, stored as +91XXXXXXXXXX whatever the buyer typed. The messages are keys
// (Errors.phone and so on in the message files), so each page can show them in its language.
export const indianMobile = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "phone"))
  .transform((digits) => `+91${digits}`);

// The fields every public form collects, with the DPDP consent the spec requires.
export const buyerContact = z.object({
  buyerName: z.string().trim().min(2, "name").max(80),
  buyerPhone: indianMobile,
  language: z.enum(["EN", "HI"]),
  consent: z.literal(true, "consent"),
});

// What a form sends: the server still refuses anything without consent.
export type FormInput<T extends z.ZodType> = Omit<z.input<T>, "consent"> & { consent: boolean };

// A whole number typed as text, with an error key (Errors.<key>) that each page shows in its language.
export function wholeNumberKey(min: number, max: number, key: string) {
  return z.string().trim().regex(/^\d{1,7}$/, key).transform(Number).pipe(z.number().min(min, key).max(max, key));
}
