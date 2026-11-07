"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState, useTransition } from "react";
import { bookTestDrive, loadTakenSlots } from "@/app/[locale]/(public)/test-drive/actions";
import { SlotScheduler } from "@/components/booking/slot-scheduler";
import { ConsentField } from "@/components/forms/consent-field";
import { Field } from "@/components/forms/field";
import { LanguageField } from "@/components/forms/language-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import type { BookingOptions } from "@/lib/booking/queries";
import { bookingDays } from "@/lib/booking/slots";
import { formatSlot } from "@/lib/dates";
import { errorText, localised } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

type Step = "car" | "time" | "details";
const STEPS: Step[] = ["car", "time", "details"];

const cardStyle =
  "flex h-full gap-4 rounded-xl border bg-card p-4 transition-colors peer-checked:border-foreground peer-checked:ring-1 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50";

type Props = { options: BookingOptions; preselected: { showroomId: string; demoCarId: string } | null };

export function BookingFlow({ options, preselected }: Props) {
  const t = useTranslations("Booking");
  const labels = useTranslations("Labels");
  const content = useTranslations("Content");
  const errors = useTranslations("Errors");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>(preselected ? "time" : "car");
  const [showroomId, setShowroomId] = useState(preselected?.showroomId ?? options[0].id);
  const [demoCarId, setDemoCarId] = useState(preselected?.demoCarId ?? null);
  const [takenSlots, setTakenSlots] = useState<Set<string> | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [details, setDetails] = useState({ buyerName: "", buyerPhone: "", language: (locale === "hi" ? "HI" : "EN") as "EN" | "HI", consent: false });
  const [error, setError] = useState<{ message: string; fields?: Record<string, string[]>; nextFreeSlots?: string[] } | null>(null);
  const [pending, startTransition] = useTransition();
  const [now] = useState(() => new Date());

  const showroom = options.find((option) => option.id === showroomId) ?? options[0];
  const demoCar = showroom.demoCars.find((car) => car.id === demoCarId);
  const showroomName = (name: string) => localised(content, "showrooms", name, name, "name");
  const showroomAddress = (name: string, address: string) => localised(content, "showrooms", name, address, "address");

  const openTimes = (carId: string) =>
    startTransition(async () => {
      setTakenSlots(new Set(await loadTakenSlots(carId)));
      setStep("time");
    });

  const submit = () =>
    startTransition(async () => {
      if (!demoCarId || !slot) return;
      const result = await bookTestDrive({ demoCarId, slotStart: slot, ...details });
      if (result.ok) return router.push(`/test-drive/booked/${result.cancelToken}`);
      setError({ message: result.error, fields: result.fieldErrors, nextFreeSlots: result.nextFreeSlots });
      if (result.nextFreeSlots) setTakenSlots(new Set([...(takenSlots ?? []), slot]));
    });

  return (
    <div className="flex flex-col gap-8">
      <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {STEPS.map((item, index) => (
          <li
            key={item}
            aria-current={item === step ? "step" : undefined}
            className={cn("flex items-center gap-2", item === step ? "text-foreground" : "text-muted-foreground")}
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full border tabular-nums",
                item === step && "border-foreground bg-foreground text-background",
              )}
            >
              {index + 1}
            </span>
            {t(`steps.${item}`)}
          </li>
        ))}
      </ol>

      {step === "car" && (
        <div className="flex flex-col gap-8">
          <fieldset>
            <legend className="mb-3 text-sm text-muted-foreground">{t("showroom")}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {options.map((option) => (
                <label key={option.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="showroom"
                    checked={option.id === showroomId}
                    onChange={() => {
                      setShowroomId(option.id);
                      setDemoCarId(null);
                    }}
                    className="peer sr-only"
                  />
                  <span className={cn(cardStyle, "flex-col gap-1")}>
                    <span className="text-lg">{showroomName(option.name)}</span>
                    <span className="text-sm text-muted-foreground">{showroomAddress(option.name, option.address)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm text-muted-foreground">{t("demoCarAt", { showroom: showroomName(showroom.name) })}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {showroom.demoCars.map((car) => (
                <label key={car.id} className={car.available ? "cursor-pointer" : undefined}>
                  <input
                    type="radio"
                    name="demoCar"
                    checked={car.id === demoCarId}
                    disabled={!car.available}
                    onChange={() => setDemoCarId(car.id)}
                    className="peer sr-only"
                  />
                  <span className={cardStyle}>
                    <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {car.variant.model.photos[0] && (
                        <Image src={car.variant.model.photos[0]} alt="" fill sizes="96px" className="object-cover" />
                      )}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-lg">
                        {car.variant.model.name} {car.variant.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {car.available
                          ? `${labels(`transmission.${car.variant.transmission}`)}, ${labels(`fuel.${car.variant.fuel}`)}`
                          : t("inService")}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button size="lg" className="self-start" disabled={!demoCar || pending} onClick={() => demoCar && openTimes(demoCar.id)}>
            {pending ? t("loadingSlots") : t("chooseTime")}
          </Button>
        </div>
      )}

      {step === "time" && demoCar && (
        <div className="flex max-w-xl flex-col gap-6">
          <p className="text-muted-foreground">
            {t("summary", { car: `${demoCar.variant.model.name} ${demoCar.variant.name}`, showroom: showroomName(showroom.name) })}{" "}
            <button type="button" className="text-foreground underline underline-offset-4" onClick={() => setStep("car")}>
              {t("change")}
            </button>
          </p>
          {takenSlots ? (
            <SlotScheduler
              days={bookingDays(now)}
              hours={showroom}
              takenSlots={takenSlots}
              now={now}
              selectedSlot={slot}
              onSelect={setSlot}
            />
          ) : (
            <Button variant="outline" className="self-start" disabled={pending} onClick={() => openTimes(demoCar.id)}>
              {pending ? t("loadingSlots") : t("showFreeSlots")}
            </Button>
          )}
          <Button size="lg" className="self-start" disabled={!slot} onClick={() => setStep("details")}>
            {t("continue")}
          </Button>
        </div>
      )}

      {step === "details" && demoCar && slot && (
        <form
          className="flex max-w-xl flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <p className="text-muted-foreground">
            {t("summaryWhen", {
              car: `${demoCar.variant.model.name} ${demoCar.variant.name}`,
              showroom: showroomName(showroom.name),
              when: formatSlot(new Date(slot), locale),
            })}{" "}
            <button type="button" className="text-foreground underline underline-offset-4" onClick={() => setStep("time")}>
              {t("change")}
            </button>
          </p>

          <Field label={t("name")} error={error?.fields?.buyerName?.[0] && errorText(errors, error.fields.buyerName[0])}>
            <Input
              autoComplete="name"
              value={details.buyerName}
              aria-invalid={Boolean(error?.fields?.buyerName)}
              onChange={(event) => setDetails({ ...details, buyerName: event.target.value })}
              required
            />
          </Field>

          <Field label={t("phone")} error={error?.fields?.buyerPhone?.[0] && errorText(errors, error.fields.buyerPhone[0])}>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
              value={details.buyerPhone}
              aria-invalid={Boolean(error?.fields?.buyerPhone)}
              onChange={(event) => setDetails({ ...details, buyerPhone: event.target.value })}
              required
            />
          </Field>

          <LanguageField value={details.language} onChange={(language) => setDetails({ ...details, language })} />

          <ConsentField checked={details.consent} onChange={(consent) => setDetails({ ...details, consent })} kind="testDrive" />

          {error && (
            <div role="alert" className="rounded-xl bg-muted p-4">
              <p>{errorText(errors, error.message)}</p>
              {error.nextFreeSlots && error.nextFreeSlots.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {error.nextFreeSlots.map((free) => (
                    <Button
                      key={free}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSlot(free);
                        setError(null);
                      }}
                    >
                      {formatSlot(new Date(free), locale)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button type="submit" size="lg" className="self-start" disabled={pending || !details.consent}>
            {pending ? t("booking") : t("confirm")}
          </Button>
        </form>
      )}
    </div>
  );
}
