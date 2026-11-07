import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { TradeInForm } from "@/components/trade-in/trade-in-form";
import { getTradeInOptions } from "@/lib/catalogue";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/trade-in">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TradeIn" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: alternatesFor("/trade-in", locale) };
}

// Coming from a car page pre-selects that car (?model=model-h).
async function Form({ searchParams }: { searchParams: PageProps<"/[locale]/trade-in">["searchParams"] }) {
  const [{ showrooms, models }, { model }] = await Promise.all([getTradeInOptions(), searchParams]);
  const initialModelId = models.find((option) => option.slug === model)?.id ?? "";
  return <TradeInForm showrooms={showrooms} models={models} initialModelId={initialModelId} />;
}

export default async function TradeInPage({ params, searchParams }: PageProps<"/[locale]/trade-in">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("TradeIn");

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex max-w-2xl flex-col gap-3">
        <h1 className="text-5xl font-display tracking-tight sm:text-6xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("lead")}</p>
      </div>
      <Suspense fallback={<div className="h-96 max-w-2xl animate-pulse rounded-2xl bg-muted" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
