"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { generateLeadAssist, sendLeadReply } from "@/app/consultant/ai-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { INTENT_LABEL } from "@/lib/ai/schema";
import type { AssistOutcome } from "@/lib/ai/service";
import type { AiDraftView } from "@/lib/ai/view";
import { MAX_DRAFT_WORDS, wordCount } from "@/lib/ai/words";
import { formatSlot } from "@/lib/dates";

const NOTICE_TEXT = {
  ai_unavailable: "AI unavailable, template shown",
  low_confidence: "Low confidence: check the enquiry",
} as const;

const CONFIDENCE_VARIANT = { high: "success", medium: "warning", low: "danger" } as const;

type Props = { leadId: string; initial: AiDraftView | null; buyerOptedOut: boolean };

export function AiAssistPanel({ leadId, initial, buyerOptedOut }: Props) {
  const [draft, setDraft] = useState(initial);
  const [text, setText] = useState(initial?.draft ?? "");
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<AssistOutcome>, onDone: (view: AiDraftView) => void) =>
    startTransition(async () => {
      const outcome = await action();
      if (outcome.ok) onDone(outcome.draft);
      else toast.error(outcome.error);
    });

  const generate = () =>
    run(
      () => generateLeadAssist(leadId),
      (view) => {
        setDraft(view);
        setText(view.draft);
      },
    );

  const send = () =>
    draft &&
    run(
      () => sendLeadReply({ draftId: draft.id, text }),
      (view) => {
        setDraft(view);
        toast.success("Reply approved and saved to the outbox (simulated)");
      },
    );

  const words = wordCount(text);
  const sent = draft?.sentAt != null;

  return (
    <section aria-labelledby="ai-title" className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ai-title" className="text-lg">
          AI summary and reply
        </h2>
        <Badge variant="outline">Draft only</Badge>
      </div>

      {!draft ? (
        <>
          <p className="text-muted-foreground">
            Summarises the enquiry and drafts a first reply in the buyer&apos;s language. Nothing is sent until you approve it.
          </p>
          <Button className="self-start" onClick={generate} disabled={pending}>
            {pending ? "Reading the enquiry…" : "Summarise and draft a reply"}
          </Button>
        </>
      ) : (
        <>
          {draft.notice && (
            <p role="status" className="rounded-xl bg-status-due/15 px-4 py-3 text-status-due">
              {NOTICE_TEXT[draft.notice]}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {draft.intent && <Badge variant="neutral">{INTENT_LABEL[draft.intent]}</Badge>}
            {!draft.usedTemplate && <Badge variant={CONFIDENCE_VARIANT[draft.confidence]}>{draft.confidence} confidence</Badge>}
          </div>

          <ul className="list-disc space-y-1 pl-5">
            {draft.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          {draft.missingInfo.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Ask the buyer</p>
              <ul className="list-disc space-y-1 pl-5">
                {draft.missingInfo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.removed.length > 0 && (
            <div className="rounded-xl bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Removed from the AI&apos;s draft</p>
              <ul className="space-y-2 text-sm">
                {draft.removed.map((removal) => (
                  <li key={removal.text}>
                    <q>{removal.text}</q> <span className="text-muted-foreground">Removed because {removal.reason}.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sent ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Sent (simulated), {formatSlot(draft.sentAt!)}. {draft.sentText === draft.draft ? "Sent as drafted." : "Edited before sending."}
                </p>
                <p className="mt-2 rounded-xl bg-muted p-4">{draft.sentText}</p>
              </div>
              <Button variant="outline" className="self-start" onClick={generate} disabled={pending}>
                {pending ? "Reading the enquiry…" : "Draft another reply"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Reply to the buyer. Edit it if you like, then approve.</span>
                <Textarea className="min-h-36" value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} />
                <span className={words > MAX_DRAFT_WORDS ? "text-sm text-status-due" : "text-sm text-muted-foreground"}>
                  {words} words
                </span>
              </label>
              {buyerOptedOut && <p className="text-sm text-destructive">This buyer has opted out of messages, so a reply can&apos;t be sent.</p>}
              <div className="flex flex-wrap gap-2">
                <Button onClick={send} disabled={pending || buyerOptedOut || text.trim() === ""}>
                  Approve and send (simulated)
                </Button>
                <Button variant="outline" onClick={generate} disabled={pending}>
                  {pending ? "Reading the enquiry…" : "Draft again"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Nothing goes to the buyer. Approving saves the message to the outbox.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
