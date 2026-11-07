import type { Fuel, Transmission, UsedCarStatus } from "@/generated/prisma/enums";
import type { Option } from "@/lib/admin/price-queries";
import { INSPECTION_AREAS, resultsFromReport, type InspectionResult } from "@/lib/admin/used-car-report";
import { db } from "@/lib/db";
import { z } from "zod";

export type AdminUsedCar = {
  id: string;
  stockId: string;
  carName: string;
  year: number;
  km: number;
  pricePaise: number;
  status: UsedCarStatus;
  showroomName: string;
  leads: number;
};

export async function getAdminUsedCars(): Promise<AdminUsedCar[]> {
  const cars = await db.usedCar.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      stockId: true,
      variantName: true,
      year: true,
      km: true,
      pricePaise: true,
      status: true,
      model: { select: { name: true } },
      showroom: { select: { name: true } },
      _count: { select: { leads: true } },
    },
  });
  return cars.map((car) => ({
    id: car.id,
    stockId: car.stockId,
    carName: `${car.model.name} ${car.variantName}`,
    year: car.year,
    km: car.km,
    pricePaise: car.pricePaise,
    status: car.status,
    showroomName: car.showroom.name,
    leads: car._count.leads,
  }));
}

export type UsedCarOptions = { models: { id: string; name: string; photos: string[] }[]; showrooms: Option[] };

export async function getUsedCarOptions(): Promise<UsedCarOptions> {
  const [models, showrooms] = await Promise.all([
    db.model.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, photos: true } }),
    db.showroom.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { models, showrooms: showrooms.map((showroom) => ({ value: showroom.id, label: showroom.name })) };
}

const reportSchema = z.object({
  score: z.number(),
  inspectedOn: z.string(),
  checks: z.array(z.object({ area: z.string(), result: z.enum(["PASS", "ATTENTION"]) })),
});

export type UsedCarFormValues = {
  id: string;
  stockId: string;
  modelId: string;
  modelName: string;
  showroomId: string;
  variantName: string;
  fuel: Fuel;
  transmission: Transmission;
  year: string;
  km: string;
  owners: string;
  regNumber: string;
  price: string;
  status: UsedCarStatus;
  inspectedOn: string;
  score: string;
  results: InspectionResult[];
  photo: string;
};

export async function getUsedCarForEdit(id: string): Promise<UsedCarFormValues | null> {
  const car = await db.usedCar.findUnique({ where: { id }, include: { model: { select: { name: true } } } });
  if (!car) return null;

  const report = reportSchema.parse(car.inspectionReport);
  return {
    id: car.id,
    stockId: car.stockId,
    modelId: car.modelId,
    modelName: car.model.name,
    showroomId: car.showroomId,
    variantName: car.variantName,
    fuel: car.fuel,
    transmission: car.transmission,
    year: String(car.year),
    km: String(car.km),
    owners: String(car.owners),
    regNumber: car.regNumber,
    price: String(Math.round(car.pricePaise / 100)),
    status: car.status,
    inspectedOn: report.inspectedOn,
    score: String(report.score),
    results: resultsFromReport(report.checks),
    photo: car.photos[0] ?? "",
  };
}

export const BLANK_RESULTS: InspectionResult[] = INSPECTION_AREAS.map(() => "PASS");
