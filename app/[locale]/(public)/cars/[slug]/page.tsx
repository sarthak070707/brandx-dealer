import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CarConfigurator } from "@/components/car/car-configurator";
import { DetailSkeleton } from "@/components/detail-skeleton";
import { JsonLd } from "@/components/json-ld";
import { Link } from "@/i18n/navigation";
import { getCarPage, getModelSlugs } from "@/lib/catalogue";
import { localised } from "@/lib/i18n/content";
import { alternatesFor, carJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export async function generateStaticParams() {
  return getModelSlugs();
}

export async function generateMetadata({ params }: PageProps<"/[locale]/cars/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const [car, t, content] = await Promise.all([
    getCarPage(slug),
    getTranslations({ locale, namespace: "Car" }),
    getTranslations({ locale, namespace: "Content" }),
  ]);
  if (!car) return {};
  return {
    title: t("metaTitle", { name: car.name }),
    description: t("metaDescription", { description: localised(content, "models", car.slug, car.description) }),
    alternates: alternatesFor(`/cars/${car.slug}`, locale),
  };
}

async function CarDetail({ params }: { params: PageProps<"/[locale]/cars/[slug]">["params"] }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [car, cars, content, nav] = await Promise.all([
    getCarPage(slug),
    getTranslations("Cars"),
    getTranslations("Content"),
    getTranslations("Nav"),
  ]);
  if (!car || car.variants.length === 0) notFound();

  const lowestPaise = car.variants[0]?.exShowroomPaise ?? null;
  const description = localised(content, "models", car.slug, car.description);

  return (
    <>
      <JsonLd data={carJsonLd({ name: car.name, description, photos: car.photos, lowestPaise, variantCount: car.variants.length }, siteUrl())} />
      <nav aria-label={nav("breadcrumb")} className="mb-6 text-sm text-muted-foreground">
        <Link href="/cars" className="-mx-2 -my-3.5 inline-block px-2 py-3.5 underline-offset-4 hover:underline">
          {cars("title")}
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
export default function CarPage({ params }: PageProps<"/[locale]/cars/[slug]">) {
  return (
    <main className="px-4 pt-6 sm:px-8 lg:px-12 lg:pb-section">
      <Suspense fallback={<DetailSkeleton />}>
        <CarDetail params={params} />
      </Suspense>
    </main>
  );
}
