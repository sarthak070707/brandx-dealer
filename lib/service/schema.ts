import { z } from "zod";
import { REGISTRATION, normaliseRegistration } from "@/lib/registration";
import { buyerContact, type FormInput, wholeNumberKey } from "@/lib/validation";

export const SERVICE_TYPES = ["PERIODIC", "REPAIR", "ACCESSORIES", "CHECKUP"] as const;
export const MAX_NOTES_LENGTH = 500;

// Every message is a key into the Errors messages, so each page shows it in its own language.
export const serviceBookingSchema = buyerContact.extend({
  showroomId: z.string().min(1, "showroom"),
  slotStart: z.iso.datetime("slotUnavailable").transform((value) => new Date(value)),
  serviceType: z.enum(SERVICE_TYPES, "serviceType"),
  vehicle: z.string().trim().min(3, "yourCar").max(60, "yourCar"),
  regNumber: z.string().transform(normaliseRegistration).pipe(z.string().regex(REGISTRATION, "regNumber")),
  km: wholeNumberKey(0, 999_999, "tradeKm"),
  notes: z
    .string()
    .trim()
    .max(MAX_NOTES_LENGTH, "messageTooLong")
    .transform((value) => value || null),
});

export type ServiceBookingInput = FormInput<typeof serviceBookingSchema>;
