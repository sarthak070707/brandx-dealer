import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/detail-skeleton";
import { EnquirySheet } from "@/components/enquiry/enquiry-sheet";
import { EmiCalculator } from "@/components/finance/emi-calculator";
import { JsonLd } from "@/components/json-ld";
import { InspectionReport } from "@/components/used/inspection-report";
import { Link } from "@/i18n/navigation";
import { formatClock } from "@/lib/dates";
import { FUEL_LABEL } from "@/lib/labels";
import { localised } from "@/lib/i18n/content";
import { formatRupees } from "@/lib/money";
import { alternatesFor, usedCarJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getUsedCar, getUsedCarStockIds } from "@/lib/used-cars/queries";

const kmFormat = new Intl.NumberFormat("en-IN");

export async function generateStaticParams() {
  return getUsedCarStockIds();
}

export async function generateMetadata({ params }: PageProps<"/[locale]/used-cars/[stockId]">): Promise<Metadata> {
  const { locale, stockId } = await params;
  const [car, t, card] = await Promise.all([
    getUsedCar(stockId),
    getTranslations({ locale, namespace: "UsedDetail" }),
    getTranslations({ locale, namespace: "UsedCard" }),
  ]);
  if (!car) return {};
  return {
    title: t("metaTitle", { year: car.year, name: `${car.modelName} ${car.variantName}`, price: formatRupees(car.pricePaise) }),
    description: t("metaDescription", {
      km: kmFormat.format(car.km),
      owners: card("owners", { count: car.owners }),
      score: car.inspection.score,
    }),
    alternates: alternatesFor(`/used-cars/${car.stockId}`, locale),
  };
}

async function UsedCarDetail({ params }: { params: PageProps<"/[locale]/used-cars/[stockId]">["params"] }) {
  const { locale, stockId } = await params;
  setRequestLocale(locale);
  const [car, t, card, labels, content, common, nav] = await Promise.all([
    getUsedCar(stockId),
    getTranslations("UsedDetail"),
    getTranslations("UsedCard"),
    getTranslations("Labels"),
    getTranslations("Content"),
    getTranslations("Common"),
    getTranslations("Nav"),
  ]);
  if (!car) notFound();

  const notes = { AVAILABLE: null, BOOKED: t("noteBooked"), SOLD: t("noteSold") } as const;
  const facts = [
    { label: t("year"), value: String(car.year) },
    { label: t("fuel"), value: labels(`fuel.${car.fuel}`) },
    { label: t("transmission"), value: labels(`transmission.${car.transmission}`) },
    { label: t("driven"), value: t("kmValue", { km: kmFormat.format(car.km) }) },
    { label: t("owners"), value: card("owners", { count: car.owners }) },
    { label: t("registration"), value: car.registration },
  ];
  const showroomName = localised(content, "showrooms", car.showroom.name, car.showroom.name, "name");

  const structuredData = usedCarJsonLd(
    {
      name: `${car.modelName} ${car.variantName}`,
      year: car.year,
      km: car.km,
      fuel: FUEL_LABEL[car.fuel],
      pricePaise: car.pricePaise,
      status: car.status,
      photo: car.photos[0] ?? null,
    },
    siteUrl(),
  );

  return (
    <>
      <JsonLd data={structuredData} />
      <nav aria-label={nav("breadcrumb")} className="mb-6 text-sm text-muted-foreground">
        <Link href="/used-cars" className="underline-offset-4 hover:underline">
          {t("breadcrumb")}
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-foreground">
          {car.stockId}
        </span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
        <div className="flex flex-col gap-10">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            {car.photos[0] && (
              <Image
                src={car.photos[0]}
                alt={t("photoAlt", { name: `${car.modelName} ${car.variantName}` })}
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
          <InspectionReport inspection={car.inspection} />
          {car.status !== "SOLD" && <EmiCalculator pricePaise={car.pricePaise} />}
        </div>

        <section aria-labelledby="car-title" className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{car.stockId}</p>
            <h1 id="car-title" className="text-5xl leading-none font-display tracking-tight">
              {car.modelName} {car.variantName}
            </h1>
            <p className="text-3xl font-light tabular-nums">{formatRupees(car.pricePaise)}</p>
          </div>

          {notes[car.status] && <p className="rounded-xl bg-muted p-4">{notes[car.status]}</p>}

          {car.status !== "SOLD" && (
            <EnquirySheet
              target={{ type: "used", stockId: car.stockId }}
              carLabel={`${car.modelName} ${car.variantName}`}
              label={t("enquire")}
              variant="primary"
              size="lg"
            />
          )}

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border">
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col gap-1 bg-card p-4">
                <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="text-lg">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-lg">{t("seeAt", { showroom: showroomName })}</h2>
            <p className="text-muted-foreground">{localised(content, "showrooms", car.showroom.name, car.showroom.address, "address")}</p>
            <p className="text-sm text-muted-foreground">
              {common("hours", { open: formatClock(car.showroom.openMinute), close: formatClock(car.showroom.closeMinute) })}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">{t("photoNote")}</p>
        </section>
      </div>
    </>
  );
}

// The stock ID comes from the URL, so the details stream in behind a placeholder and
// navigation to the page stays instant.
export default function UsedCarPage({ params }: PageProps<"/[locale]/used-cars/[stockId]">) {
  return (
    <main className="px-4 pt-6 pb-20 sm:px-8 lg:px-12 lg:pb-section">
      <Suspense fallback={<DetailSkeleton />}>
        <UsedCarDetail params={params} />
      </Suspense>
    </main>
  );
}
