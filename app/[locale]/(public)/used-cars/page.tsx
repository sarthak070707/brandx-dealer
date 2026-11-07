import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UsedCarBrowser } from "@/components/used/used-car-browser";
import { alternatesFor } from "@/lib/seo";
import { filterOptionsFor } from "@/lib/used-cars/filter";
import { getUsedCars } from "@/lib/used-cars/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/used-cars">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Used" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: alternatesFor("/used-cars", locale) };
}

export default async function UsedCarsPage({ params }: PageProps<"/[locale]/used-cars">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [cars, t] = await Promise.all([getUsedCars(), getTranslations("Used")]);

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex flex-col gap-3">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">{t("title")}</h1>
        <p className="max-w-prose text-lg text-muted-foreground">{t("lead")}</p>
      </div>
      {cars.length > 0 ? (
        <UsedCarBrowser cars={cars} options={filterOptionsFor(cars)} />
      ) : (
        <p className="rounded-2xl border bg-card p-8 text-lg">{t("empty")}</p>
      )}
    </main>
  );
}
