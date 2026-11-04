import { z } from "zod";
import type { Confidence } from "@/generated/prisma/enums";
import { INTENTS, type ConfidenceLevel, type Intent } from "@/lib/ai/schema";
import type { Notice } from "@/lib/ai/generate";
import type { Removal } from "@/lib/ai/guard";

// What is kept in AiDraft.summaryJson, next to the draft text itself.
export const storedAssistSchema = z.object({
  summary: z.array(z.string()),
  intent: z.enum(INTENTS).nullable(),
  missingInfo: z.array(z.string()),
  notice: z.enum(["ai_unavailable", "low_confidence"]).nullable(),
  removed: z.array(z.object({ kind: z.enum(["discount", "amount"]), text: z.string(), reason: z.string() })),
});

export type AiDraftView = {
  id: string;
  summary: string[];
  intent: Intent | null;
  missingInfo: string[];
  notice: Notice | null;
  removed: Removal[];
  confidence: ConfidenceLevel;
  draft: string;
  usedTemplate: boolean;
  sentText: string | null;
  sentAt: Date | null;
  createdAt: Date;
};

type DraftRow = {
  id: string;
  summaryJson: unknown;
  draftText: string;
  confidence: Confidence;
  usedTemplate: boolean;
  finalSentText: string | null;
  sentAt: Date | null;
  createdAt: Date;
};

export function toDraftView(row: DraftRow): AiDraftView | null {
  const stored = storedAssistSchema.safeParse(row.summaryJson);
  if (!stored.success) return null;
  return {
    id: row.id,
    ...stored.data,
    confidence: row.confidence.toLowerCase() as ConfidenceLevel,
    draft: row.draftText,
    usedTemplate: row.usedTemplate,
    sentText: row.finalSentText,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  };
}
