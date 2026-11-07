import type { BodyType, Fuel, Transmission } from "@/generated/prisma/enums";
import type { Option } from "@/lib/admin/price-queries";
import { db } from "@/lib/db";

export type AdminCar = {
  id: string;
  slug: string;
  name: string;
  bodyType: BodyType;
  featured: boolean;
  colourCount: number;
  variants: { name: string; fuel: Fuel; transmission: Transmission }[];
  leads: number;
  usedCars: number;
};

export async function getAdminCars(): Promise<AdminCar[]> {
  const models = await db.model.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      bodyType: true,
      featured: true,
      _count: { select: { leads: true, usedCars: true } },
      variants: { select: { name: true, fuel: true, transmission: true, colours: true }, orderBy: { code: "asc" } },
    },
  });

  return models.map((model) => ({
    id: model.id,
    slug: model.slug,
    name: model.name,
    bodyType: model.bodyType,
    featured: model.featured,
    // Every variant of a car shares its colours, so the first one tells how many there are.
    colourCount: Array.isArray(model.variants[0]?.colours) ? model.variants[0].colours.length : 0,
    variants: model.variants.map(({ name, fuel, transmission }) => ({ name, fuel, transmission })),
    leads: model._count.leads,
    usedCars: model._count.usedCars,
  }));
}

export async function getShowroomOptions(): Promise<Option[]> {
  const showrooms = await db.showroom.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return showrooms.map((showroom) => ({ value: showroom.id, label: showroom.name }));
}
