import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { indiaToday } from "@/lib/dates";
import type { BodyType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { USED_STOCK_TAG } from "@/lib/used-cars/queries";
import { computeOnRoadPrice, offeredPacks, roundToRupee, validOn, type PriceTables } from "@/lib/pricing/on-road-price";

// Tag for everything on the car pages that comes from the admin tables.
export const CATALOGUE_TAG = "catalogue";

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
  cacheTag(CATALOGUE_TAG);
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
  cacheTag(USED_STOCK_TAG);
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
  cacheTag(CATALOGUE_TAG);
  cacheLife("hours");

  return db.model.findMany({ select: { slug: true } });
}

const coloursSchema = z.array(z.object({ name: z.string(), hex: z.string(), photo: z.string() }));
const specsSchema = z.record(z.string(), z.union([z.string(), z.number()]));

export type CarPageData = NonNullable<Awaited<ReturnType<typeof getCarPage>>>;
export type CarVariant = CarPageData["variants"][number];

// Every variant x city price (without accessories) is computed here on the server, so the
// page can switch between them instantly without exposing the price tables. The page adds any
// accessory packs the buyer ticks to that price.
export async function getCarPage(slug: string) {
  "use cache";
  cacheTag(CATALOGUE_TAG);
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
      cities.map((city) => [
        city.id,
        computeOnRoadPrice(tables, { variant: { ...variant, modelId: model.id }, cityId: city.id, date: today, packs: [] }),
      ]),
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

  const accessoryPackages = offeredPacks(model.accessoryPackages, today).map((pack) => ({
    id: pack.id,
    name: pack.name,
    paise: roundToRupee(pack.pricePaise),
    items: pack.items,
    validTo: pack.validTo,
  }));

  return {
    slug: model.slug,
    name: model.name,
    description: model.description,
    photos: model.photos,
    variants,
    cities,
    showrooms: showrooms.map(({ id, name }) => ({ id, name })),
    defaultCityId: showrooms[0]?.cityId ?? cities[0].id,
    accessoryPackages,
  };
}

// What the trade-in form offers to pick from: the showrooms, and the Brand X cars a buyer may be eyeing.
export async function getTradeInOptions() {
  "use cache";
  cacheTag(CATALOGUE_TAG);
  cacheLife("minutes");

  const [showrooms, models] = await Promise.all([
    db.showroom.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.model.findMany({ orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } }),
  ]);
  return { showrooms, models };
}

// The showrooms the service page offers, with the hours the date picker needs.
export async function getServiceOptions() {
  "use cache";
  cacheTag(CATALOGUE_TAG);
  cacheLife("minutes");

  return db.showroom.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, address: true, openMinute: true, closeMinute: true } });
}
