import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getBookingOptions, type BookingOptions } from "@/lib/booking/queries";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/test-drive">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Booking" });
  return { title: t("metaTitle"), description: t("lead"), alternates: alternatesFor("/test-drive", locale) };
}

// Coming from a model page pre-selects the first showroom with that model's demo car (spec).
function preselect(options: BookingOptions, modelSlug: string | undefined) {
  for (const showroom of options) {
    const car = showroom.demoCars.find((demo) => demo.available && demo.variant.model.slug === modelSlug);
    if (car) return { showroomId: showroom.id, demoCarId: car.id };
  }
  return null;
}

async function Booking({ searchParams }: { searchParams: PageProps<"/[locale]/test-drive">["searchParams"] }) {
  const [options, { model }] = await Promise.all([getBookingOptions(), searchParams]);
  return <BookingFlow options={options} preselected={preselect(options, typeof model === "string" ? model : undefined)} />;
}

export default async function TestDrivePage({ params, searchParams }: PageProps<"/[locale]/test-drive">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Booking");

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex max-w-2xl flex-col gap-3">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("lead")}</p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <Booking searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
