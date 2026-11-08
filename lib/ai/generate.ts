import type { Language } from "@/generated/prisma/enums";
import { aiOutputSchema, type ConfidenceLevel, type Intent } from "@/lib/ai/schema";
import { guardDraft, type Removal } from "@/lib/ai/guard";
import { languageProblem } from "@/lib/ai/language";
import { asksAboutPrice } from "@/lib/ai/price-intent";
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

type Parsed = { output: ReturnType<typeof aiOutputSchema.parse> } | { problem: string };

// Either the usable answer, or what was wrong with it in a sentence the model can act on. The problems
// are the schema's own messages, never anything the buyer wrote.
function parseOutput(raw: string, language: Language): Parsed {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { problem: "it was not a single valid JSON object" };
  }
  const parsed = aiOutputSchema.safeParse(json);
  if (parsed.success) {
    // The language is checked in code, because the model cannot be trusted to keep to it.
    const wrongLanguage = languageProblem(parsed.data.reply_draft, language);
    return wrongLanguage ? { problem: `reply_draft: ${wrongLanguage}` } : { output: parsed.data };
  }
  return { problem: parsed.error.issues.slice(0, 3).map((issue) => `${issue.path.join(".") || "answer"}: ${issue.message}`).join("; ") };
}

// Two tries within the deadline. After a failed try the model sees its own answer and what was wrong with
// it, so the second try can fix it; a network error or an unusable answer both end in the template.
async function askModel(facts: AiLeadFacts, complete: Complete, deadlineMs: number) {
  const signal = AbortSignal.timeout(deadlineMs);
  const first = buildMessages(facts);
  let messages = first;
  for (let attempt = 0; attempt < ATTEMPTS && !signal.aborted; attempt++) {
    try {
      const raw = await complete(messages, signal);
      const parsed = parseOutput(raw, facts.language);
      if ("output" in parsed) return parsed.output;
      messages = [
        ...first,
        { role: "assistant", content: raw },
        { role: "user", content: `That answer was rejected because ${parsed.problem}. Answer again with the same single JSON object, with that fixed.` },
      ];
    } catch {
      // A failed call is simply tried again, once.
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
  // A price is quoted only when the buyer asked about money; otherwise no amount is allowed at all.
  const priceAsked = asksAboutPrice(facts.message);
  const allowedPaise = priceAsked ? facts.prices.map((price) => price.paise) : [];

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

  const guarded = guardDraft(output.reply_draft, allowedPaise, facts.specs, { priceNotAsked: !priceAsked });
  if (guarded.text.length < MIN_USEFUL_DRAFT_CHARS) {
    return { ...base, draft: reply("standard"), usedTemplate: true, notice: null, removed: guarded.removed };
  }
  return { ...base, draft: fillPlaceholders(guarded.text, names, facts.language), usedTemplate: false, notice: null, removed: guarded.removed };
}
