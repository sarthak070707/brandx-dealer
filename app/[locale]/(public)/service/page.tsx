import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";
import { ServiceBookingFlow } from "@/components/service/service-booking-flow";
import { getServiceOptions } from "@/lib/catalogue";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/service">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Service" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: alternatesFor("/service", locale) };
}

// The dates on offer depend on today, so this is drawn for each visitor rather than pre-built.
async function Booking() {
  await connection();
  return <ServiceBookingFlow showrooms={await getServiceOptions()} nowIso={new Date().toISOString()} />;
}

export default async function ServicePage({ params }: PageProps<"/[locale]/service">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Service");

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex max-w-2xl flex-col gap-3">
        <h1 className="text-5xl font-display tracking-tight sm:text-6xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("lead")}</p>
      </div>
      <Suspense fallback={<div className="h-96 max-w-2xl animate-pulse rounded-2xl bg-muted" />}>
        <Booking />
      </Suspense>
    </main>
  );
}
