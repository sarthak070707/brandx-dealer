import { z } from "zod";
import { buyerContact, type FormInput } from "@/lib/validation";

export const MAX_MESSAGE_LENGTH = 500;

// What the buyer was looking at. The server resolves every id itself; nothing here is trusted.
const target = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("model"),
    modelSlug: z.string().min(1),
    variantId: z.string().min(1),
    cityId: z.string().min(1),
    showroomId: z.string().min(1),
  }),
  z.object({ type: z.literal("used"), stockId: z.string().min(1) }),
]);

export const enquirySchema = buyerContact.extend({
  target,
  message: z
    .string()
    .trim()
    .max(MAX_MESSAGE_LENGTH, `Keep it under ${MAX_MESSAGE_LENGTH} characters`)
    .transform((value) => value || null),
});

export type EnquiryInput = FormInput<typeof enquirySchema>;
