"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

const LANGUAGES = [
  { value: "EN", name: "english" },
  { value: "HI", name: "hindi" },
] as const;

type Language = (typeof LANGUAGES)[number]["value"];

// Which language the dealership should reply in. It starts as the language the visitor is reading.
export function LanguageField({ value, onChange }: { value: Language; onChange: (language: Language) => void }) {
  const t = useTranslations("Forms");
  const names = useTranslations("Language");
  const name = useId();

  return (
    <fieldset>
      <legend className="mb-2 text-sm text-muted-foreground">{t("preferredLanguage")}</legend>
      <div className="flex gap-6">
        {LANGUAGES.map((language) => (
          <label key={language.value} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name={name}
              checked={value === language.value}
              onChange={() => onChange(language.value)}
              className="size-4 accent-foreground"
            />
            {names(language.name)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
