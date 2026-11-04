"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/lib/auth/staff";
import { createAssist, sendReply, type AssistOutcome } from "@/lib/ai/service";

const SIGN_IN_AGAIN = { ok: false, error: "Please sign in again." } as const;
const BAD_REQUEST = { ok: false, error: "That request isn't valid." } as const;

export async function generateLeadAssist(leadId: string): Promise<AssistOutcome> {
  const staff = await getStaff();
  if (!staff) return SIGN_IN_AGAIN;
  const parsed = z.string().min(1).safeParse(leadId);
  return parsed.success ? createAssist(staff, parsed.data) : BAD_REQUEST;
}

const sendInput = z.object({ draftId: z.string().min(1), text: z.string() });

export async function sendLeadReply(input: z.input<typeof sendInput>): Promise<AssistOutcome> {
  const staff = await getStaff();
  if (!staff) return SIGN_IN_AGAIN;
  const parsed = sendInput.safeParse(input);
  if (!parsed.success) return BAD_REQUEST;

  const outcome = await sendReply(staff, parsed.data.draftId, parsed.data.text);
  // Sending adds a line to the lead's history.
  if (outcome.ok) refresh();
  return outcome;
}
