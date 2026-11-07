import type { z } from "zod";
import type { UsedCarStatus } from "@/generated/prisma/enums";
import { photoIdFrom } from "@/lib/admin/car-photos";
import { pathErrorsOf } from "@/lib/admin/field-errors";
import { buildInspectionReport, nextStockId } from "@/lib/admin/used-car-report";
import { usedCarSchema } from "@/lib/admin/used-car-schemas";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";

export type UsedCarResult =
  | { ok: true; stockId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const GONE = { ok: false, error: "This car no longer exists. Reload the page." } as const;
const MAX_STOCK_ID_TRIES = 3;

const invalid = (error: z.ZodError): UsedCarResult => ({ ok: false, error: "Check the highlighted fields.", fieldErrors: pathErrorsOf(error) });
const problem = (field: string, message: string): UsedCarResult => ({ ok: false, error: message, fieldErrors: { [field]: message } });

// Adds a used car, or changes one. Its stock number and its model are fixed once it exists.
export async function saveUsedCar(input: unknown): Promise<UsedCarResult> {
  const parsed = usedCarSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const car = parsed.data;

  const existing = car.id ? await db.usedCar.findUnique({ where: { id: car.id }, select: { id: true, stockId: true, modelId: true, photos: true } }) : null;
  if (car.id && !existing) return GONE;
  const modelId = existing?.modelId ?? car.modelId;

  const [model, showrooms, duplicate] = await Promise.all([
    db.model.findUnique({ where: { id: modelId }, select: { photos: true } }),
    db.showroom.count({ where: { id: car.showroomId } }),
    db.usedCar.findFirst({
      where: { regNumber: car.regNumber, status: { not: "SOLD" }, ...(existing && { id: { not: existing.id } }) },
      select: { stockId: true },
    }),
  ]);
  if (!model) return problem("modelId", "Choose a car");
  if (!showrooms) return problem("showroomId", "Choose a showroom");
  if (duplicate) return problem("regNumber", `This registration is already in stock as ${duplicate.stockId}`);

  // A photo is the model's own, one this car already has, or one that was uploaded and is stored.
  const uploadId = photoIdFrom(car.photo);
  const known = model.photos.includes(car.photo) || existing?.photos.includes(car.photo);
  if (!known && !(uploadId && (await db.carPhoto.count({ where: { id: uploadId } })))) return problem("photo", "Choose or upload a photo");

  const data = {
    showroomId: car.showroomId,
    variantName: car.variantName,
    fuel: car.fuel,
    transmission: car.transmission,
    year: car.year,
    km: car.km,
    owners: car.owners,
    regNumber: car.regNumber,
    pricePaise: car.price,
    status: car.status,
    inspectionReport: buildInspectionReport({ score: car.score, inspectedOn: car.inspectedOn, results: car.results }),
    photos: [car.photo],
  };

  if (existing) {
    await db.usedCar.update({ where: { id: existing.id }, data });
    return { ok: true, stockId: existing.stockId };
  }

  // The next stock number is read and then used, so two admins adding at once could pick the same one;
  // the unique stock number then refuses the second, which simply reads again.
  for (let attempt = 0; attempt < MAX_STOCK_ID_TRIES; attempt += 1) {
    const stockId = nextStockId((await db.usedCar.findMany({ select: { stockId: true } })).map((row) => row.stockId));
    try {
      await db.usedCar.create({ data: { ...data, stockId, modelId } });
      return { ok: true, stockId };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  return { ok: false, error: "Couldn't give the car a stock number. Please try again." };
}

export async function setUsedCarStatus(id: string, status: UsedCarStatus): Promise<UsedCarResult> {
  const car = await db.usedCar.findUnique({ where: { id }, select: { stockId: true } });
  if (!car) return GONE;
  await db.usedCar.update({ where: { id }, data: { status } });
  return { ok: true, stockId: car.stockId };
}

// A car with leads keeps its history: it is marked Sold instead of being deleted.
export async function removeUsedCar(id: string): Promise<UsedCarResult> {
  const car = await db.usedCar.findUnique({ where: { id }, select: { stockId: true, _count: { select: { leads: true } } } });
  if (!car) return GONE;
  if (car._count.leads > 0) {
    const leads = car._count.leads;
    return { ok: false, error: `${car.stockId} has ${leads} ${leads === 1 ? "lead" : "leads"}, so it stays in the system. Mark it Sold instead.` };
  }
  await db.usedCar.delete({ where: { id } });
  return { ok: true, stockId: car.stockId };
}
