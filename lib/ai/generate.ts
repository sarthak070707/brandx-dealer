import { aiOutputSchema, type ConfidenceLevel, type Intent } from "@/lib/ai/schema";
import { guardDraft, type Removal } from "@/lib/ai/guard";
import { buildMessages } from "@/lib/ai/prompt";
import { fillPlaceholders, templateReply, type TemplateKind } from "@/lib/ai/templates";
import type { AiLeadFacts, ChatMessage, DraftNames } from "@/lib/ai/types";

export type Complete = (messages: ChatMessage[], signal: AbortSignal) => Promise<string>;
export type Notice = "ai_unavailable" | "low_confidence";

export type AssistResult = {
  summary: string[];
  intent: Intent | null;
  missingInfo: string[];
  confidence: ConfidenceLevel;
  draft: string;
  usedTemplate: boolean;
  notice: Notice | null;
  removed: Removal[];
};

// Spec: about 8 seconds in total, with one retry when the answer is unusable.
const DEADLINE_MS = 8_000;
const ATTEMPTS = 2;
const MIN_USEFUL_DRAFT_CHARS = 20;
const MIN_MESSAGE_CHARS = 8;
const MESSAGE_PREVIEW_CHARS = 140;

const carOf = ({ model, variant, usedCar }: AiLeadFacts) =>
  usedCar?.label ?? ([model, variant].filter(Boolean).join(" ") || "a car");

// Used when the AI can't summarise: only facts the lead already holds.
function basicSummary(facts: AiLeadFacts) {
  const lines = [`Asked about the ${carOf(facts)} in ${facts.city}.`];
  const message = facts.message?.trim();
  lines.push(message ? `Wrote: "${message.slice(0, MESSAGE_PREVIEW_CHARS)}"` : "Left no message.");
  if (facts.testDrive) lines.push(`Test drive booked for ${facts.testDrive.when} at ${facts.testDrive.showroom}.`);
  return lines;
}

// Nothing to summarise: no message and no test drive. The AI isn't asked, so it can't guess.
const isThin = (facts: AiLeadFacts) => (facts.message?.trim().length ?? 0) < MIN_MESSAGE_CHARS && !facts.testDrive;

function parseOutput(raw: string) {
  try {
    const parsed = aiOutputSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function askModel(facts: AiLeadFacts, complete: Complete, deadlineMs: number) {
  const signal = AbortSignal.timeout(deadlineMs);
  const messages = buildMessages(facts);
  for (let attempt = 0; attempt < ATTEMPTS && !signal.aborted; attempt++) {
    try {
      const output = parseOutput(await complete(messages, signal));
      if (output) return output;
    } catch {
      // A failed call is treated like an unusable answer: retry once, then fall back.
    }
  }
  return null;
}

export async function generateAssist(
  facts: AiLeadFacts,
  names: DraftNames,
  complete: Complete,
  deadlineMs = DEADLINE_MS,
): Promise<AssistResult> {
  const reply = (kind: TemplateKind) => fillPlaceholders(templateReply(facts.language, kind), names, facts.language);
  const allowedPaise = facts.prices.map((price) => price.paise);

  if (isThin(facts)) {
    return { summary: basicSummary(facts), intent: null, missingInfo: [], confidence: "low", draft: reply("clarifying"), usedTemplate: true, notice: "low_confidence", removed: [] };
  }

  const output = await askModel(facts, complete, deadlineMs);
  if (!output) {
    return { summary: basicSummary(facts), intent: null, missingInfo: [], confidence: "low", draft: reply("standard"), usedTemplate: true, notice: "ai_unavailable", removed: [] };
  }

  const base = { summary: output.summary, intent: output.intent, missingInfo: output.missing_info, confidence: output.confidence };
  if (output.confidence === "low") {
    return { ...base, draft: reply("clarifying"), usedTemplate: true, notice: "low_confidence", removed: [] };
  }

  const guarded = guardDraft(output.reply_draft, allowedPaise);
  if (guarded.text.length < MIN_USEFUL_DRAFT_CHARS) {
    return { ...base, draft: reply("standard"), usedTemplate: true, notice: null, removed: guarded.removed };
  }
  return { ...base, draft: fillPlaceholders(guarded.text, names, facts.language), usedTemplate: false, notice: null, removed: guarded.removed };
}
