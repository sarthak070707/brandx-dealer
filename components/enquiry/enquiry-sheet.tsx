"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { submitEnquiry } from "@/app/[locale]/(public)/enquire/actions";
import { ConsentField } from "@/components/forms/consent-field";
import { Field } from "@/components/forms/field";
import { LanguageField } from "@/components/forms/language-field";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { EnquiryResult } from "@/lib/leads/create-enquiry";
import { errorText, localised } from "@/lib/i18n/content";
import { MAX_MESSAGE_LENGTH } from "@/lib/leads/enquiry-schema";

type Target =
  | { type: "model"; modelSlug: string; variantId: string; cityId: string; showrooms: { id: string; name: string }[] }
  | { type: "used"; stockId: string };

type Props = {
  target: Target;
  carLabel: string;
  label: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
};

const emptyFor = (locale: string) => ({
  buyerName: "",
  buyerPhone: "",
  message: "",
  language: (locale === "hi" ? "HI" : "EN") as "EN" | "HI",
  consent: false,
});

export function EnquirySheet({ target, carLabel, label, variant = "outline", size = "md" }: Props) {
  const t = useTranslations("Enquiry");
  const errors = useTranslations("Errors");
  const content = useTranslations("Content");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(() => emptyFor(locale));
  const [showroomId, setShowroomId] = useState(target.type === "model" ? target.showrooms[0].id : "");
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [pending, startTransition] = useTransition();

  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // A finished enquiry starts fresh next time the panel opens.
    if (!next && result?.ok) {
      setDetails(emptyFor(locale));
      setResult(null);
    }
  };

  const send = () =>
    startTransition(async () => {
      const sent = target.type === "model"
        ? { type: "model" as const, modelSlug: target.modelSlug, variantId: target.variantId, cityId: target.cityId, showroomId }
        : target;
      setResult(await submitEnquiry({ ...details, target: sent }));
    });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant={variant} size={size}>
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined} className="flex flex-col gap-6 overflow-y-auto">
        <SheetTitle className="pr-8 text-2xl">{t("title", { car: carLabel })}</SheetTitle>

        {result?.ok ? (
          <div className="flex flex-col gap-4">
            <p className="text-lg">{t("thanks", { name: details.buyerName })}</p>
            <p className="text-muted-foreground">
              {t("callSoon", {
                who: result.consultantName ?? t("teamWho"),
                showroom: localised(content, "showrooms", result.showroomName, result.showroomName, "name"),
              })}
              {result.acknowledged && ` ${t("whatsapp")}`}
            </p>
            <SheetClose asChild>
              <Button className="self-start">{t("done")}</Button>
            </SheetClose>
          </div>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <Field label={t("name")} error={fieldErrors?.buyerName?.[0] && errorText(errors, fieldErrors.buyerName[0])}>
              <Input autoComplete="name" value={details.buyerName} aria-invalid={Boolean(fieldErrors?.buyerName)} onChange={(event) => setDetails({ ...details, buyerName: event.target.value })} required />
            </Field>
            <Field label={t("phone")} error={fieldErrors?.buyerPhone?.[0] && errorText(errors, fieldErrors.buyerPhone[0])}>
              <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={details.buyerPhone} aria-invalid={Boolean(fieldErrors?.buyerPhone)} onChange={(event) => setDetails({ ...details, buyerPhone: event.target.value })} required />
            </Field>
            {target.type === "model" && (
              <Field label={t("showroomPick")}>
                <NativeSelect value={showroomId} onChange={(event) => setShowroomId(event.target.value)}>
                  {target.showrooms.map((showroom) => (
                    <option key={showroom.id} value={showroom.id}>
                      {localised(content, "showrooms", showroom.name, showroom.name, "name")}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <Field label={t("question")} error={fieldErrors?.message?.[0] && errorText(errors, fieldErrors.message[0])}>
              <Textarea value={details.message} maxLength={MAX_MESSAGE_LENGTH} onChange={(event) => setDetails({ ...details, message: event.target.value })} />
            </Field>
            <LanguageField value={details.language} onChange={(language) => setDetails({ ...details, language })} />
            <ConsentField checked={details.consent} onChange={(consent) => setDetails({ ...details, consent })} kind="enquiry" />

            {result && !result.ok && (
              <p role="alert" className="rounded-xl bg-muted p-4">
                {errorText(errors, result.error)}
              </p>
            )}
            <Button type="submit" size="lg" disabled={pending || !details.consent}>
              {pending ? t("sending") : t("send")}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
