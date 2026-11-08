import { z } from "zod";
import { MAX_DRAFT_WORDS, wordCount } from "@/lib/ai/words";

export const INTENTS = ["test_drive", "price_quote", "exchange", "finance", "other"] as const;
export const CONFIDENCES = ["high", "medium", "low"] as const;

export type Intent = (typeof INTENTS)[number];
export type ConfidenceLevel = (typeof CONFIDENCES)[number];

export const INTENT_LABEL: Record<Intent, string> = {
  test_drive: "Test drive",
  price_quote: "Price quote",
  exchange: "Exchange",
  finance: "Finance",
  other: "Other",
};

// The shape the model must return (spec), checked on every response before anything is used.
export const aiOutputSchema = z.object({
  // More lines than asked for are cut, not rejected; the reply and its limits are what matter.
  summary: z
    .array(z.string().trim().min(1))
    .min(1)
    .transform((lines) => lines.slice(0, 3)),
  intent: z.enum(INTENTS),
  missing_info: z
    .array(z.string().trim().min(1))
    .transform((items) => items.slice(0, 4)),
  confidence: z.enum(CONFIDENCES),
  reply_draft: z
    .string()
    .trim()
    .min(1)
    .refine((text) => wordCount(text) <= MAX_DRAFT_WORDS, `Keep the reply under ${MAX_DRAFT_WORDS} words`),
});

export type AiOutput = z.infer<typeof aiOutputSchema>;
