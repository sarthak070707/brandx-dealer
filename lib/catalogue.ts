import { cacheLife } from "next/cache";
import { z } from "zod";
import { indiaToday } from "@/lib/dates";
import type { BodyType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { computeOnRoadPrice, validOn, type PriceTables } from "@/lib/pricing/on-road-price";

export type ModelSummary = {
  slug: string;
  name: string;
  bodyType: BodyType;
  description: string;
  photos: string[];
  featured: boolean;
  fromPaise: number | null;
};

// Lowest ex-showroom price valid today per model; null when no current price exists.
export async function getModelLineup(): Promise<ModelSummary[]> {
  "use cache";
  cacheLife("hours");

  const today = indiaToday(new Date());
  const models = await db.model.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      bodyType: true,
      description: true,
      photos: true,
      featured: true,
      variants: {
        select: {
          prices: {
            where: { validFrom: { lte: today }, validTo: { gte: today } },
            select: { exShowroomPaise: true },
          },
        },
      },
    },
  });

  return models.map(({ variants, ...model }) => {
    const prices = variants.flatMap((variant) => variant.prices.map((price) => price.exShowroomPaise));
    return { ...model, fromPaise: prices.length ? Math.min(...prices) : null };
  });
}

export async function getAvailableUsedCarCount() {
  "use cache";
  cacheLife("minutes");

  return db.usedCar.count({ where: { status: "AVAILABLE" } });
}

export async function getCityNames() {
  "use cache";
  cacheLife("days");

  const cities = await db.city.findMany({ orderBy: { name: "asc" }, select: { name: true } });
  return cities.map((city) => city.name);
}

export async function getShowrooms() {
  "use cache";
  cacheLife("days");

  return db.showroom.findMany({
    orderBy: { name: "asc" },
    select: { name: true, address: true, openMinute: true, closeMinute: true },
  });
}

export async function getModelSlugs() {
  "use cache";
  cacheLife("hours");

  return db.model.findMany({ select: { slug: true } });
}

const coloursSchema = z.array(z.object({ name: z.string(), hex: z.string(), photo: z.string() }));
const specsSchema = z.record(z.string(), z.union([z.string(), z.number()]));

export type CarPageData = NonNullable<Awaited<ReturnType<typeof getCarPage>>>;
export type CarVariant = CarPageData["variants"][number];

// Every variant x city x accessories quote is computed here on the server, so the
// page can switch between them instantly without exposing the price tables.
export async function getCarPage(slug: string) {
  "use cache";
  cacheLife("minutes");

  const model = await db.model.findUnique({
    where: { slug },
    include: { variants: { include: { prices: true, insuranceRates: true } }, accessoryPackages: true },
  });
  if (!model) return null;

  const [cities, roadTaxRules, showrooms] = await Promise.all([
    db.city.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.roadTaxRule.findMany(),
    db.showroom.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, cityId: true } }),
  ]);
  const today = indiaToday(new Date());
  const tables: PriceTables = {
    variantPrices: model.variants.flatMap((variant) => variant.prices),
    roadTaxRules,
    insuranceRates: model.variants.flatMap((variant) => variant.insuranceRates),
    accessoryPackages: model.accessoryPackages,
  };

  const quotesFor = (variant: { id: string; fuel: (typeof model.variants)[number]["fuel"] }) =>
    Object.fromEntries(
      cities.map((city) => {
        const request = { variant: { ...variant, modelId: model.id }, cityId: city.id, date: today };
        return [
          city.id,
          {
            withAccessories: computeOnRoadPrice(tables, { ...request, includeAccessories: true }),
            withoutAccessories: computeOnRoadPrice(tables, { ...request, includeAccessories: false }),
          },
        ];
      }),
    );

  const variants = model.variants
    .map((variant) => ({
      id: variant.id,
      name: variant.name,
      fuel: variant.fuel,
      transmission: variant.transmission,
      specs: specsSchema.parse(variant.specs),
      colours: coloursSchema.parse(variant.colours),
      exShowroomPaise: validOn(variant.prices, today)?.exShowroomPaise ?? null,
      quotes: quotesFor(variant),
    }))
    .sort((a, b) => (a.exShowroomPaise ?? Infinity) - (b.exShowroomPaise ?? Infinity));

  const accessoryPackage = validOn(model.accessoryPackages, today);

  return {
    slug: model.slug,
    name: model.name,
    description: model.description,
    photos: model.photos,
    variants,
    cities,
    showrooms: showrooms.map(({ id, name }) => ({ id, name })),
    defaultCityId: showrooms[0]?.cityId ?? cities[0].id,
    accessoryPackage: accessoryPackage
      ? { name: accessoryPackage.name, pricePaise: accessoryPackage.pricePaise, items: accessoryPackage.items }
      : null,
  };
}
