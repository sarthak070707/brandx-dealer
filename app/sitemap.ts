import type { MetadataRoute } from "next";
import { getModelSlugs } from "@/lib/catalogue";
import { siteUrl } from "@/lib/site";
import { getUsedCarStockIds } from "@/lib/used-cars/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [models, usedCars] = await Promise.all([getModelSlugs(), getUsedCarStockIds()]);
  const paths = [
    "",
    "/cars",
    "/used-cars",
    "/test-drive",
    "/privacy",
    ...models.map((model) => `/cars/${model.slug}`),
    ...usedCars.map((car) => `/used-cars/${car.stockId}`),
  ];
  return paths.map((path) => ({ url: `${siteUrl()}${path}` }));
}
