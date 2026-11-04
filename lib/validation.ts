import { z } from "zod";

// Indian mobile numbers, stored as +91XXXXXXXXXX whatever the buyer typed.
export const indianMobile = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"))
  .transform((digits) => `+91${digits}`);

// The fields every public form collects, with the DPDP consent the spec requires.
export const buyerContact = z.object({
  buyerName: z.string().trim().min(2, "Enter your name").max(80),
  buyerPhone: indianMobile,
  language: z.enum(["EN", "HI"]),
  consent: z.literal(true, "Please agree so we can contact you"),
});

// What a form sends: the server still refuses anything without consent.
export type FormInput<T extends z.ZodType> = Omit<z.input<T>, "consent"> & { consent: boolean };
