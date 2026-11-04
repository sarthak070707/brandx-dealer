"use client";

import { useId } from "react";

const LANGUAGES = [
  { value: "EN", label: "English" },
  { value: "HI", label: "हिन्दी" },
] as const;

type Language = (typeof LANGUAGES)[number]["value"];

export function LanguageField({ value, onChange }: { value: Language; onChange: (language: Language) => void }) {
  const name = useId();

  return (
    <fieldset>
      <legend className="mb-2 text-sm text-muted-foreground">Preferred language</legend>
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
            {language.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
