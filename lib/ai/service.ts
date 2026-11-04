import { db } from "@/lib/db";
import type { StaffUser } from "@/lib/leads/access";
import { leadScope } from "@/lib/leads/access";
import { loadAssistContext } from "@/lib/ai/context";
import { generateAssist } from "@/lib/ai/generate";
import { completeWithGroq } from "@/lib/ai/groq";
import { toDraftView, type AiDraftView } from "@/lib/ai/view";
import { z } from "zod";

export type AssistOutcome = { ok: true; draft: AiDraftView } | { ok: false; error: string };

const NOT_AVAILABLE = { ok: false, error: "This lead isn't available to you." } as const;
const MAX_REPLY_CHARS = 1_000;

const CONFIDENCE = { high: "HIGH", medium: "MEDIUM", low: "LOW" } as const;

// Generated on demand and kept in AiDraft, so reopening a lead never calls the AI again.
export async function createAssist(staff: StaffUser, leadId: string): Promise<AssistOutcome> {
  const context = await loadAssistContext(staff, leadId);
  if (!context) return NOT_AVAILABLE;

  const result = await generateAssist(context.facts, context.names, completeWithGroq);
  const row = await db.aiDraft.create({
    data: {
      leadId,
      summaryJson: {
        summary: result.summary,
        intent: result.intent,
        missingInfo: result.missingInfo,
        notice: result.notice,
        removed: result.removed,
      },
      draftText: result.draft,
      confidence: CONFIDENCE[result.confidence],
      guardFlags: [...new Set(result.removed.map((removal) => removal.kind))],
      usedTemplate: result.usedTemplate,
    },
  });

  const draft = toDraftView(row);
  return draft ? { ok: true, draft } : { ok: false, error: "The draft could not be saved." };
}

const replyText = z.string().trim().min(1, "Write a reply first.").max(MAX_REPLY_CHARS, `Keep it under ${MAX_REPLY_CHARS} characters.`);

// Sending is simulated: the approved text goes to the outbox and the history, never to the buyer.
export async function sendReply(staff: StaffUser, draftId: string, text: string): Promise<AssistOutcome> {
  const parsedText = replyText.safeParse(text);
  if (!parsedText.success) return { ok: false, error: parsedText.error.issues[0].message };

  const draft = await db.aiDraft.findFirst({
    where: { id: draftId, lead: { is: leadScope(staff) } },
    select: { leadId: true, sentAt: true, lead: { select: { optedOutAt: true } } },
  });
  if (!draft) return NOT_AVAILABLE;
  if (draft.sentAt) return { ok: false, error: "This reply has already been sent." };
  if (draft.lead.optedOutAt) return { ok: false, error: "This buyer has opted out of messages." };

  const sent = await db.$transaction(async (tx) => {
    // Matching on "not sent yet" keeps a double click from sending twice.
    const updated = await tx.aiDraft.updateMany({
      where: { id: draftId, sentAt: null },
      data: { finalSentText: parsedText.data, sentAt: new Date() },
    });
    if (updated.count === 0) return false;
    await tx.outboxMessage.create({ data: { leadId: draft.leadId, channel: "WHATSAPP", body: parsedText.data } });
    await tx.leadEvent.create({
      data: { leadId: draft.leadId, type: "MESSAGE", actorId: staff.id, details: { channel: "WHATSAPP", simulated: true, kind: "reply" } },
    });
    return true;
  });
  if (!sent) return { ok: false, error: "This reply has already been sent." };

  const row = await db.aiDraft.findUniqueOrThrow({ where: { id: draftId } });
  const view = toDraftView(row);
  return view ? { ok: true, draft: view } : { ok: false, error: "The reply was sent but could not be shown." };
}
