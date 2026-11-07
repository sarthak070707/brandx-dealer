"use client";

import { useTranslations } from "next-intl";

type Props = { checked: boolean; onChange: (checked: boolean) => void; kind: "testDrive" | "enquiry" | "tradeIn" };

// The DPDP consent the spec requires on every public form, in plain language and in the
// visitor's language. It is never ticked for them.
export function ConsentField({ checked, onChange, kind }: Props) {
  const t = useTranslations("Consent");

  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border bg-card p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 accent-foreground"
        required
      />
      <span className="text-sm">{t(kind)}</span>
    </label>
  );
}
