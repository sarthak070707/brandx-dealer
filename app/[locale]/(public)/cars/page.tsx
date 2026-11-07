import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ModelCard } from "@/components/model-card";
import { intlTag } from "@/i18n/format";
import { getCityNames, getModelLineup } from "@/lib/catalogue";
import { localised } from "@/lib/i18n/content";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/cars">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cars" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: alternatesFor("/cars", locale) };
}

export default async function NewCarsPage({ params }: PageProps<"/[locale]/cars">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [lineup, cities, t, content] = await Promise.all([
    getModelLineup(),
    getCityNames(),
    getTranslations("Cars"),
    getTranslations("Content"),
  ]);
  const byPrice = lineup.toSorted((a, b) => (a.fromPaise ?? Infinity) - (b.fromPaise ?? Infinity));
  const cityList = new Intl.ListFormat(intlTag(locale)).format(cities.map((city) => localised(content, "cities", city, city)));

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex flex-col gap-3">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("lead", { count: lineup.length, cities: cityList })}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {byPrice.map((model) => (
          <li key={model.slug}>
            <ModelCard model={model} />
          </li>
        ))}
      </ul>
    </main>
  );
}
