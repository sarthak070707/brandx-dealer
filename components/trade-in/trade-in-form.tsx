"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { submitTradeIn } from "@/app/[locale]/(public)/trade-in/actions";
import { ConsentField } from "@/components/forms/consent-field";
import { Field } from "@/components/forms/field";
import { LanguageField } from "@/components/forms/language-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { errorText, localised } from "@/lib/i18n/content";
import { MAX_NOTES_LENGTH, TRADE_IN_CONDITIONS } from "@/lib/leads/trade-in-schema";
import type { TradeInResult } from "@/lib/leads/create-trade-in";

type Props = { showrooms: { id: string; name: string }[]; models: { id: string; name: string }[]; initialModelId: string };

const sectionStyle = "flex flex-col gap-5 rounded-2xl border bg-card p-6";

export function TradeInForm({ showrooms, models, initialModelId }: Props) {
  const t = useTranslations("TradeIn");
  const errors = useTranslations("Errors");
  const content = useTranslations("Content");
  const locale = useLocale();
  const [form, setForm] = useState({
    buyerName: "",
    buyerPhone: "",
    language: (locale === "hi" ? "HI" : "EN") as "EN" | "HI",
    consent: false,
    yourCar: "",
    year: "",
    km: "",
    owners: "1",
    condition: "GOOD",
    expectedPrice: "",
    notes: "",
    showroomId: "",
    modelId: initialModelId,
  });
  const [result, setResult] = useState<TradeInResult | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [field]: value }));
  const fieldError = (field: string) => {
    const key = result && !result.ok ? result.fieldErrors?.[field]?.[0] : undefined;
    return key ? errorText(errors, key) : undefined;
  };
  const text = (field: "buyerName" | "buyerPhone" | "yourCar" | "year" | "km" | "owners" | "expectedPrice", label: string, extra: { placeholder?: string; numeric?: boolean; autoComplete?: string; type?: string } = {}) => (
    <Field label={label} error={fieldError(field)}>
      <Input
        type={extra.type}
        value={form[field]}
        placeholder={extra.placeholder}
        autoComplete={extra.autoComplete}
        inputMode={extra.numeric ? "numeric" : undefined}
        aria-invalid={Boolean(fieldError(field))}
        onChange={(event) => set(field, event.target.value)}
      />
    </Field>
  );

  const submit = () => startTransition(async () => setResult(await submitTradeIn(form as never)));

  if (result?.ok) {
    return (
      <div role="status" className="flex max-w-2xl flex-col gap-3 rounded-2xl border bg-card p-6">
        <p className="text-2xl">{t("thanks", { name: form.buyerName })}</p>
        <p className="text-muted-foreground">
          {t("callSoon", {
            who: result.consultantName ?? t("teamWho"),
            showroom: localised(content, "showrooms", result.showroomName, result.showroomName, "name"),
            car: form.yourCar,
          })}
          {result.acknowledged && ` ${t("whatsapp")}`}
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <section className={sectionStyle} aria-labelledby="trade-car">
        <h2 id="trade-car" className="text-xl">
          {t("yourCarHeading")}
        </h2>
        {text("yourCar", t("yourCar"), { placeholder: t("yourCarPlaceholder") })}
        <div className="grid gap-4 sm:grid-cols-3">
          {text("year", t("year"), { placeholder: "2018", numeric: true })}
          {text("km", t("km"), { placeholder: "62000", numeric: true })}
          {text("owners", t("owners"), { numeric: true })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("condition")} error={fieldError("condition")}>
            <NativeSelect value={form.condition} onChange={(event) => set("condition", event.target.value)}>
              {TRADE_IN_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {t(`conditions.${condition}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {text("expectedPrice", t("expectedPrice"), { placeholder: "4,50,000", numeric: true })}
        </div>
        <Field label={t("notes")} error={fieldError("notes")}>
          <Textarea rows={3} maxLength={MAX_NOTES_LENGTH} value={form.notes} onChange={(event) => set("notes", event.target.value)} />
        </Field>
      </section>

      <section className={sectionStyle} aria-labelledby="trade-you">
        <h2 id="trade-you" className="text-xl">
          {t("aboutYouHeading")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("buyerName", t("name"), { autoComplete: "name" })}
          {text("buyerPhone", t("phone"), { placeholder: "98765 43210", autoComplete: "tel", type: "tel" })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("showroom")} error={fieldError("showroomId")}>
            <NativeSelect value={form.showroomId} onChange={(event) => set("showroomId", event.target.value)}>
              <option value="">{t("showroom")}</option>
              {showrooms.map((showroom) => (
                <option key={showroom.id} value={showroom.id}>
                  {localised(content, "showrooms", showroom.name, showroom.name, "name")}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("interested")} error={fieldError("modelId")}>
            <NativeSelect value={form.modelId} onChange={(event) => set("modelId", event.target.value)}>
              <option value="">{t("notSure")}</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <LanguageField value={form.language} onChange={(language) => set("language", language)} />
        <ConsentField checked={form.consent} onChange={(consent) => set("consent", consent)} kind="tradeIn" />
        {fieldError("consent") && <p className="text-sm text-destructive">{fieldError("consent")}</p>}
      </section>

      {result && !result.ok && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(errors, result.error)}
        </p>
      )}
      <Button type="submit" size="lg" className="self-start" disabled={pending}>
        {pending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
