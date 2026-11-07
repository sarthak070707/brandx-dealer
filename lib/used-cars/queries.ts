import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { maskRegistration } from "@/lib/used-cars/mask-registration";

const inspectionSchema = z.object({
  score: z.number(),
  inspectedOn: z.string(),
  checks: z.array(z.object({ area: z.string(), result: z.enum(["PASS", "ATTENTION"]) })),
});

// Everything about the used stock on the public site is tagged, so an admin change reaches it quickly.
export const USED_STOCK_TAG = "used-stock";

export type UsedCarCard = Awaited<ReturnType<typeof getUsedCars>>[number];
export type UsedCarDetail = NonNullable<Awaited<ReturnType<typeof getUsedCar>>>;

// Sold cars drop off the listing; booked ones stay, marked, so buyers can see what moves.
export async function getUsedCars() {
  "use cache";
  cacheTag(USED_STOCK_TAG);
  cacheLife("minutes");

  const cars = await db.usedCar.findMany({
    where: { status: { in: ["AVAILABLE", "BOOKED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      stockId: true,
      variantName: true,
      fuel: true,
      transmission: true,
      year: true,
      km: true,
      owners: true,
      pricePaise: true,
      status: true,
      photos: true,
      model: { select: { slug: true, name: true } },
      showroom: { select: { name: true } },
    },
  });

  return cars.map(({ model, showroom, photos, ...car }) => ({
    ...car,
    modelSlug: model.slug,
    modelName: model.name,
    showroomName: showroom.name,
    photo: photos[0] ?? null,
  }));
}

export async function getUsedCarStockIds() {
  "use cache";
  cacheTag(USED_STOCK_TAG);
  cacheLife("hours");

  return db.usedCar.findMany({ select: { stockId: true } });
}

export async function getUsedCar(stockId: string) {
  "use cache";
  cacheTag(USED_STOCK_TAG);
  cacheLife("minutes");

  const car = await db.usedCar.findUnique({
    where: { stockId },
    include: {
      model: { select: { slug: true, name: true } },
      showroom: { select: { name: true, address: true, openMinute: true, closeMinute: true } },
    },
  });
  if (!car) return null;

  const { regNumber, inspectionReport, model, ...rest } = car;
  return {
    ...rest,
    modelSlug: model.slug,
    modelName: model.name,
    registration: maskRegistration(regNumber),
    inspection: inspectionSchema.parse(inspectionReport),
  };
}
