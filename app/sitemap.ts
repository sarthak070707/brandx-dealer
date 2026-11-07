import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getModelSlugs } from "@/lib/catalogue";
import { siteUrl } from "@/lib/site";
import { getUsedCarStockIds } from "@/lib/used-cars/queries";

// Each page is listed once per language, with its other-language versions alongside.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [models, usedCars] = await Promise.all([getModelSlugs(), getUsedCarStockIds()]);
  const paths = [
    "",
    "/cars",
    "/used-cars",
    "/test-drive",
    "/trade-in",
    "/service",
    "/privacy",
    ...models.map((model) => `/cars/${model.slug}`),
    ...usedCars.map((car) => `/used-cars/${car.stockId}`),
  ];
  const urlIn = (locale: string, path: string) => `${siteUrl()}/${locale}${path}`;

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: urlIn(locale, path),
      alternates: { languages: Object.fromEntries(routing.locales.map((other) => [other, urlIn(other, path)])) },
    })),
  );
}
