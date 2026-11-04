"use client";

import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithPassword, type SignInState } from "@/lib/auth/actions";

const INITIAL: SignInState = { error: null };

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <Field label="Email">
        <Input type="email" name="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input type="password" name="password" autoComplete="current-password" required />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
