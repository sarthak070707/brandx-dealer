import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CarConfigurator } from "@/components/car/car-configurator";
import { DetailSkeleton } from "@/components/detail-skeleton";
import { JsonLd } from "@/components/json-ld";
import { getCarPage, getModelSlugs } from "@/lib/catalogue";
import { carJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export async function generateStaticParams() {
  return getModelSlugs();
}

export async function generateMetadata({ params }: PageProps<"/cars/[slug]">): Promise<Metadata> {
  const car = await getCarPage((await params).slug);
  if (!car) return {};
  return {
    title: `${car.name} on-road price in Lucknow | Brand X`,
    description: `${car.description} See the exact on-road price for your city and book a test drive.`,
  };
}

async function CarDetail({ params }: { params: PageProps<"/cars/[slug]">["params"] }) {
  const car = await getCarPage((await params).slug);
  if (!car || car.variants.length === 0) notFound();

  const lowestPaise = car.variants[0]?.exShowroomPaise ?? null;

  return (
    <>
      <JsonLd data={carJsonLd({ name: car.name, description: car.description, photos: car.photos, lowestPaise, variantCount: car.variants.length }, siteUrl())} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/cars" className="underline-offset-4 hover:underline">
          New cars
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-foreground">
          {car.name}
        </span>
      </nav>
      <CarConfigurator car={car} />
    </>
  );
}

// The model slug comes from the URL, so the page streams in behind a placeholder and
// navigation to it stays instant.
export default function CarPage({ params }: PageProps<"/cars/[slug]">) {
  return (
    <main className="px-4 pt-6 sm:px-8 lg:px-12 lg:pb-section">
      <Suspense fallback={<DetailSkeleton />}>
        <CarDetail params={params} />
      </Suspense>
    </main>
  );
}
