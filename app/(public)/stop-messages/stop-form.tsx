"use client";

import { useActionState } from "react";
import { stopMessages, type StopState } from "@/app/(public)/stop-messages/actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL: StopState = { done: false, error: null };

type Props = { token?: string; maskedPhone?: string; linkProblem: boolean };

export function StopForm({ token, maskedPhone, linkProblem }: Props) {
  const [state, formAction, pending] = useActionState(stopMessages, INITIAL);

  if (state.done) {
    return (
      <div role="status" className="rounded-2xl border bg-card p-6">
        <p className="text-lg">Done. We won&apos;t send any more messages to this number.</p>
        <p className="mt-2 text-muted-foreground">We may still call you about an enquiry you made.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
      {token ? (
        <>
          <input type="hidden" name="token" value={token} />
          <p className="text-lg">Stop all messages to {maskedPhone}?</p>
        </>
      ) : (
        <>
          {linkProblem && <p className="text-muted-foreground">That link didn&apos;t work, but you can use your number.</p>}
          <Field label="Mobile number">
            <Input type="tel" name="phone" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required />
          </Field>
        </>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Stopping…" : "Stop all messages"}
      </Button>
    </form>
  );
}
