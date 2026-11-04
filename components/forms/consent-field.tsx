"use client";

type Props = { checked: boolean; onChange: (checked: boolean) => void; purpose: string };

// The DPDP consent the spec requires on every public form, in plain language.
export function ConsentField({ checked, onChange, purpose }: Props) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border bg-card p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 accent-foreground"
        required
      />
      <span className="text-sm">
        I agree that Brand X may contact me by phone, WhatsApp or SMS about {purpose}. My details are used only for this
        request, and I can stop messages at any time.
      </span>
    </label>
  );
}
