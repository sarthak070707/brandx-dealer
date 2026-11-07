"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function PublicError({ reset }: { reset: () => void }) {
  const t = useTranslations("Error");

  return (
    <main className="flex flex-col items-start gap-6 px-4 py-16 sm:px-8 lg:px-12 lg:pb-section">
      <h1 className="text-5xl font-display tracking-tight sm:text-6xl">{t("title")}</h1>
      <p className="max-w-prose text-lg text-muted-foreground">{t("body")}</p>
      <Button size="lg" onClick={reset}>
        {t("retry")}
      </Button>
    </main>
  );
}
