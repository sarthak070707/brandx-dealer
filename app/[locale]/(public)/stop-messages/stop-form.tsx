"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { stopMessages, type StopState } from "@/app/[locale]/(public)/stop-messages/actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorText } from "@/lib/i18n/content";

const INITIAL: StopState = { done: false, error: null };

type Props = { token?: string; maskedPhone?: string; linkProblem: boolean };

export function StopForm({ token, maskedPhone, linkProblem }: Props) {
  const t = useTranslations("Stop");
  const errors = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(stopMessages, INITIAL);

  if (state.done) {
    return (
      <div role="status" className="rounded-2xl border bg-card p-6">
        <p className="text-lg">{t("done")}</p>
        <p className="mt-2 text-muted-foreground">{t("stillCall")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
      {token ? (
        <>
          <input type="hidden" name="token" value={token} />
          <p className="text-lg">{t("confirm", { phone: maskedPhone ?? "" })}</p>
        </>
      ) : (
        <>
          {linkProblem && <p className="text-muted-foreground">{t("linkProblem")}</p>}
          <Field label={t("phone")}>
            <Input type="tel" name="phone" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required />
          </Field>
        </>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(errors, state.error)}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("pending") : t("submit")}
      </Button>
    </form>
  );
}
