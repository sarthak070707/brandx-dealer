"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { bookService, loadFullServiceSlots } from "@/app/[locale]/(public)/service/actions";
import { SlotScheduler } from "@/components/booking/slot-scheduler";
import { ConsentField } from "@/components/forms/consent-field";
import { Field } from "@/components/forms/field";
import { LanguageField } from "@/components/forms/language-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { bookingDays } from "@/lib/booking/slots";
import { formatSlot } from "@/lib/dates";
import { errorText, localised } from "@/lib/i18n/content";
import type { ServiceResult } from "@/lib/service/create-service-booking";
import { MAX_NOTES_LENGTH, SERVICE_TYPES } from "@/lib/service/schema";

type Showroom = { id: string; name: string; address: string; openMinute: number; closeMinute: number };

const sectionStyle = "flex flex-col gap-5 rounded-2xl border bg-card p-6";

// nowIso is the server's clock at the moment of the request, so the dates offered start from the right day.
export function ServiceBookingFlow({ showrooms, nowIso }: { showrooms: Showroom[]; nowIso: string }) {
  const t = useTranslations("Service");
  const errors = useTranslations("Errors");
  const content = useTranslations("Content");
  const locale = useLocale();
  const router = useRouter();
  const [now] = useState(() => new Date(nowIso));
  const [form, setForm] = useState({
    showroomId: "",
    serviceType: "PERIODIC",
    vehicle: "",
    regNumber: "",
    km: "",
    notes: "",
    buyerName: "",
    buyerPhone: "",
    language: (locale === "hi" ? "HI" : "EN") as "EN" | "HI",
    consent: false,
  });
  const [slot, setSlot] = useState<string | null>(null);
  const [full, setFull] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ServiceResult | null>(null);
  const [loadingTimes, startLoading] = useTransition();
  const [pending, startTransition] = useTransition();

  const showroom = showrooms.find((option) => option.id === form.showroomId);
  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [field]: value }));
  const failed = result && !result.ok ? result : null;
  const fieldError = (field: string) => {
    const key = failed?.fieldErrors?.[field]?.[0];
    return key ? errorText(errors, key) : undefined;
  };

  const chooseShowroom = (showroomId: string) => {
    set("showroomId", showroomId);
    setSlot(null);
    setFull(new Set());
    if (showroomId) startLoading(async () => setFull(new Set(await loadFullServiceSlots(showroomId))));
  };

  const text = (field: "vehicle" | "regNumber" | "km" | "buyerName" | "buyerPhone", label: string, extra: { placeholder?: string; numeric?: boolean; autoComplete?: string; type?: string } = {}) => (
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

  const submit = () =>
    startTransition(async () => {
      // With no time chosen yet the server still checks everything, so every problem is shown together.
      const outcome = await bookService({ ...form, slotStart: slot ?? "" } as never);
      if (outcome.ok) return router.push(`/service/booked/${outcome.cancelToken}`);
      setResult(outcome);
      // The time was taken a moment ago: the picker shows it as full from now on.
      if (outcome.error === "slotTaken" && slot) setFull((current) => new Set(current).add(slot));
    });

  return (
    <form
      className="flex max-w-2xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <section className={sectionStyle} aria-labelledby="service-where">
        <h2 id="service-where" className="text-xl">
          {t("whereHeading")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("showroom")} error={fieldError("showroomId")}>
            <NativeSelect value={form.showroomId} onChange={(event) => chooseShowroom(event.target.value)}>
              <option value="">{t("chooseShowroom")}</option>
              {showrooms.map((option) => (
                <option key={option.id} value={option.id}>
                  {localised(content, "showrooms", option.name, option.name, "name")}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("serviceType")} error={fieldError("serviceType")}>
            <NativeSelect value={form.serviceType} onChange={(event) => set("serviceType", event.target.value)}>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </section>

      <section className={sectionStyle} aria-labelledby="service-car">
        <h2 id="service-car" className="text-xl">
          {t("carHeading")}
        </h2>
        {text("vehicle", t("vehicle"), { placeholder: t("vehiclePlaceholder") })}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("regNumber", t("regNumber"), { placeholder: t("regPlaceholder") })}
          {text("km", t("km"), { placeholder: "62000", numeric: true })}
        </div>
        <Field label={t("notes")} error={fieldError("notes")}>
          <Textarea rows={3} maxLength={MAX_NOTES_LENGTH} value={form.notes} onChange={(event) => set("notes", event.target.value)} />
        </Field>
      </section>

      <section className={sectionStyle} aria-labelledby="service-time">
        <h2 id="service-time" className="text-xl">
          {t("timeHeading")}
        </h2>
        {showroom ? (
          loadingTimes ? (
            <p className="text-muted-foreground">{t("loadingTimes")}</p>
          ) : (
            <SlotScheduler days={bookingDays(now)} hours={showroom} takenSlots={full} now={now} selectedSlot={slot} onSelect={setSlot} />
          )
        ) : (
          <p className="text-muted-foreground">{t("pickShowroomFirst")}</p>
        )}
        {fieldError("slotStart") && <p className="text-sm text-destructive">{fieldError("slotStart")}</p>}
        {failed?.error === "slotTaken" && failed.nextFreeSlots && (
          <div className="flex flex-wrap gap-2">
            {failed.nextFreeSlots.map((free) => (
              <Button key={free} type="button" variant="outline" size="sm" onClick={() => setSlot(free)}>
                {formatSlot(new Date(free), locale)}
              </Button>
            ))}
          </div>
        )}
      </section>

      <section className={sectionStyle} aria-labelledby="service-you">
        <h2 id="service-you" className="text-xl">
          {t("aboutHeading")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("buyerName", t("name"), { autoComplete: "name" })}
          {text("buyerPhone", t("phone"), { placeholder: "98765 43210", autoComplete: "tel", type: "tel" })}
        </div>
        <LanguageField value={form.language} onChange={(language) => set("language", language)} />
        <ConsentField checked={form.consent} onChange={(consent) => set("consent", consent)} kind="service" />
        {fieldError("consent") && <p className="text-sm text-destructive">{fieldError("consent")}</p>}
      </section>

      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(errors, failed.error)}
        </p>
      )}
      <Button type="submit" size="lg" className="self-start" disabled={pending}>
        {pending ? t("booking") : t("confirm")}
      </Button>
    </form>
  );
}
