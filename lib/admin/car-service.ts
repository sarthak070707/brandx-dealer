import type { z } from "zod";
import { MAX_PHOTO_BYTES, detectImageType, photoIdFrom, photoUrlFor } from "@/lib/admin/car-photos";
import { addVariantSchema, carSchema, variantSchema } from "@/lib/admin/car-schemas";
import { slugify, variantCode } from "@/lib/admin/car-slug";
import { pathErrorsOf } from "@/lib/admin/field-errors";
import type { Prisma } from "@/generated/prisma/client";
import { indiaToday } from "@/lib/dates";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";

export type CarResult =
  | { ok: true; slug: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type PhotoResult = { ok: true; url: string } | { ok: false; error: string };

const DAY_MS = 24 * 60 * 60_000;
const GONE = { ok: false, error: "This car no longer exists. Reload the page." } as const;

const invalid = (error: z.ZodError): CarResult => ({ ok: false, error: "Check the highlighted fields.", fieldErrors: pathErrorsOf(error) });
const problem = (field: string, message: string): CarResult => ({ ok: false, error: message, fieldErrors: { [field]: message } });

// New prices and insurance are valid from today for a year; the price tables change them later.
function firstYear() {
  const from = indiaToday(new Date());
  return { from, to: new Date(from.getTime() + 365 * DAY_MS), year: from.getUTCFullYear() };
}

type VariantData = z.output<typeof variantSchema>;

function variantRecord(variant: VariantData, cityIds: string[], period: ReturnType<typeof firstYear>) {
  return {
    name: variant.name,
    fuel: variant.fuel,
    transmission: variant.transmission,
    modelYear: period.year,
    specs: {
      engine: variant.engine,
      powerBhp: variant.powerBhp,
      mileageKmpl: variant.mileageKmpl,
      seats: variant.seats,
      bootLitres: variant.bootLitres,
    },
    prices: { create: { exShowroomPaise: variant.exShowroom, validFrom: period.from, validTo: period.to } },
    insuranceRates: {
      create: cityIds.map((cityId) => ({ cityId, premiumPaise: variant.insurance, validFrom: period.from, validTo: period.to })),
    },
  };
}

// Only a real JPEG, PNG or WebP of a sensible size is stored, and its type is read from its
// bytes, not from what the browser claims.
export async function storeCarPhoto(file: unknown): Promise<PhotoResult> {
  if (!(file instanceof File)) return { ok: false, error: "Choose a photo." };
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) return { ok: false, error: "The photo is too large. Try a smaller one." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectImageType(bytes);
  if (!contentType) return { ok: false, error: "Upload a JPEG, PNG or WebP photo." };

  const { id } = await db.carPhoto.create({ data: { contentType, data: bytes }, select: { id: true } });
  return { ok: true, url: photoUrlFor(id) };
}

export async function createCar(input: unknown): Promise<CarResult> {
  const parsed = carSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const car = parsed.data;

  const slug = slugify(car.name);
  if (!slug) return problem("name", "Use letters or numbers in the name");
  if (await db.model.findUnique({ where: { slug }, select: { id: true } })) return problem("name", `A car called ${car.name} already exists`);

  const photoIds = [...new Set(car.colours.map((colour) => photoIdFrom(colour.photo) ?? ""))];
  const [photos, showrooms, cities] = await Promise.all([
    db.carPhoto.count({ where: { id: { in: photoIds } } }),
    car.demoShowroomId ? db.showroom.count({ where: { id: car.demoShowroomId } }) : 1,
    db.city.findMany({ select: { id: true } }),
  ]);
  if (photos !== photoIds.length) return problem("colours", "One of the photos is missing. Upload it again.");
  if (!showrooms) return problem("demoShowroomId", "Choose a showroom");

  const period = firstYear();
  const cityIds = cities.map((city) => city.id);

  try {
    await db.$transaction(async (tx) => {
      const created = await tx.model.create({
        data: {
          slug,
          name: car.name,
          bodyType: car.bodyType,
          description: car.description,
          featured: car.featured,
          photos: car.colours.map((colour) => colour.photo),
          variants: {
            create: car.variants.map((variant, index) => ({
              ...variantRecord(variant, cityIds, period),
              code: variantCode(slug, index + 1),
              colours: car.colours,
            })),
          },
        },
        select: { variants: { select: { id: true }, orderBy: { code: "asc" } } },
      });
      if (car.demoShowroomId) await tx.demoCar.create({ data: { showroomId: car.demoShowroomId, variantId: created.variants[0].id } });
    });
  } catch (error) {
    if (isUniqueViolation(error)) return problem("name", `A car called ${car.name} already exists`);
    throw error;
  }
  return { ok: true, slug };
}

// A new variant of an existing car shares that car's colours and photos.
export async function addVariant(input: unknown): Promise<CarResult> {
  const parsed = addVariantSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { modelId, variant } = parsed.data;

  const model = await db.model.findUnique({
    where: { id: modelId },
    select: { slug: true, variants: { select: { code: true, name: true, fuel: true, transmission: true, colours: true }, orderBy: { code: "asc" } } },
  });
  const first = model?.variants[0];
  if (!model || !first) return GONE;

  const same = model.variants.some(
    (existing) => existing.name.toLowerCase() === variant.name.toLowerCase() && existing.fuel === variant.fuel && existing.transmission === variant.transmission,
  );
  if (same) return problem("variant.name", "This car already has a variant with this name, fuel and transmission");

  const taken = new Set(model.variants.map((existing) => existing.code));
  let position = model.variants.length + 1;
  while (taken.has(variantCode(model.slug, position))) position += 1;

  const cities = await db.city.findMany({ select: { id: true } });
  await db.variant.create({
    data: {
      ...variantRecord(variant, cities.map((city) => city.id), firstYear()),
      code: variantCode(model.slug, position),
      modelId,
      colours: first.colours as Prisma.InputJsonValue,
    },
  });
  return { ok: true, slug: model.slug };
}

// A car with leads, used stock or bookings keeps its history, so only one added by mistake can go.
export async function removeCar(id: string): Promise<CarResult> {
  const model = await db.model.findUnique({ where: { id }, select: { slug: true, name: true } });
  if (!model) return GONE;

  const [leads, usedCars] = await Promise.all([
    db.lead.count({ where: { OR: [{ modelId: id }, { variant: { modelId: id } }] } }),
    db.usedCar.count({ where: { modelId: id } }),
  ]);
  if (leads > 0 || usedCars > 0) {
    const reasons = [leads > 0 && `${leads} ${leads === 1 ? "lead" : "leads"}`, usedCars > 0 && `${usedCars} used ${usedCars === 1 ? "car" : "cars"}`].filter(Boolean);
    return { ok: false, error: `${model.name} has ${reasons.join(" and ")}, so it stays in the system.` };
  }

  await db.$transaction([
    db.demoCar.deleteMany({ where: { variant: { modelId: id } } }),
    db.variant.deleteMany({ where: { modelId: id } }),
    db.model.delete({ where: { id } }),
  ]);
  return { ok: true, slug: model.slug };
}
