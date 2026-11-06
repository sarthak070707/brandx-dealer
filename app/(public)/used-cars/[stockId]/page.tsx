import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/detail-skeleton";
import { EnquirySheet } from "@/components/enquiry/enquiry-sheet";
import { JsonLd } from "@/components/json-ld";
import { InspectionReport } from "@/components/used/inspection-report";
import { ownersLabel } from "@/components/used/used-car-card";
import { formatClock } from "@/lib/dates";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import { usedCarJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getUsedCar, getUsedCarStockIds } from "@/lib/used-cars/queries";

const kmFormat = new Intl.NumberFormat("en-IN");

const STATUS_NOTE = {
  AVAILABLE: null,
  BOOKED: "Booked: another buyer has reserved this car. It may come back if their purchase falls through.",
  SOLD: "Sold: this car has found a new owner.",
} as const;

export async function generateStaticParams() {
  return getUsedCarStockIds();
}

export async function generateMetadata({ params }: PageProps<"/used-cars/[stockId]">): Promise<Metadata> {
  const car = await getUsedCar((await params).stockId);
  if (!car) return {};
  return {
    title: `${car.year} ${car.modelName} ${car.variantName}, ${formatRupees(car.pricePaise)} | Brand X certified used`,
    description: `${kmFormat.format(car.km)} km, ${ownersLabel(car.owners)}, inspection score ${car.inspection.score}/100.`,
  };
}

async function UsedCarDetail({ params }: { params: PageProps<"/used-cars/[stockId]">["params"] }) {
  const car = await getUsedCar((await params).stockId);
  if (!car) notFound();

  const facts = [
    { label: "Year", value: String(car.year) },
    { label: "Fuel", value: FUEL_LABEL[car.fuel] },
    { label: "Transmission", value: TRANSMISSION_LABEL[car.transmission] },
    { label: "Driven", value: `${kmFormat.format(car.km)} km` },
    { label: "Owners", value: ownersLabel(car.owners) },
    { label: "Registration", value: car.registration },
  ];

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
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/used-cars" className="underline-offset-4 hover:underline">
          Certified used
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
                alt={`${car.modelName} ${car.variantName}, stock photo`}
                fill
                preload
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
          <InspectionReport inspection={car.inspection} />
        </div>

        <section aria-labelledby="car-title" className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{car.stockId}</p>
            <h1 id="car-title" className="text-5xl leading-none font-light tracking-tight font-stretch-semi-condensed">
              {car.modelName} {car.variantName}
            </h1>
            <p className="text-3xl font-light tabular-nums">{formatRupees(car.pricePaise)}</p>
          </div>

          {STATUS_NOTE[car.status] && <p className="rounded-xl bg-muted p-4">{STATUS_NOTE[car.status]}</p>}

          {car.status !== "SOLD" && (
            <EnquirySheet
              target={{ type: "used", stockId: car.stockId }}
              carLabel={`${car.modelName} ${car.variantName}`}
              label="Enquire about this car"
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
            <h2 className="text-lg">See it at {car.showroom.name}</h2>
            <p className="text-muted-foreground">{car.showroom.address}</p>
            <p className="text-sm text-muted-foreground">
              Mon to Sat, {formatClock(car.showroom.openMinute)} to {formatClock(car.showroom.closeMinute)}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Photo shows the model; the car itself is at the showroom. The registration number is shared once you buy.
          </p>
        </section>
      </div>
    </>
  );
}

// The stock ID comes from the URL, so the details stream in behind a placeholder and
// navigation to the page stays instant.
export default function UsedCarPage({ params }: PageProps<"/used-cars/[stockId]">) {
  return (
    <main className="px-4 pt-6 pb-20 sm:px-8 lg:px-12 lg:pb-section">
      <Suspense fallback={<DetailSkeleton />}>
        <UsedCarDetail params={params} />
      </Suspense>
    </main>
  );
}
