import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { StopForm } from "@/app/[locale]/(public)/stop-messages/stop-form";
import { phoneForOptOutToken } from "@/lib/privacy/opt-out";
import { maskPhone } from "@/lib/privacy/mask-phone";

export async function generateMetadata({ params }: PageProps<"/[locale]/stop-messages">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Stop" });
  return { title: t("metaTitle"), robots: { index: false } };
}

async function StopCard({ searchParams }: { searchParams: PageProps<"/[locale]/stop-messages">["searchParams"] }) {
  const { token } = await searchParams;
  const given = typeof token === "string" ? token : undefined;
  const phone = given ? await phoneForOptOutToken(given) : null;

  return <StopForm token={phone ? given : undefined} maskedPhone={phone ? maskPhone(phone) : undefined} linkProblem={Boolean(given) && !phone} />;
}

export default async function StopMessagesPage({ params, searchParams }: PageProps<"/[locale]/stop-messages">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Stop");

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">{t("lead")}</p>
        </div>
        <Suspense fallback={<div aria-hidden="true" className="h-56 animate-pulse rounded-2xl bg-muted" />}>
          <StopCard searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
