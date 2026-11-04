import { z } from "zod";
import { buyerContact, type FormInput } from "@/lib/validation";

export const bookingSchema = buyerContact.extend({
  demoCarId: z.string().min(1),
  slotStart: z.iso.datetime().transform((value) => new Date(value)),
});

export type BookingInput = FormInput<typeof bookingSchema>;
