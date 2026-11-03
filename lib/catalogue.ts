import { cacheLife } from "next/cache";
import { indiaToday } from "@/lib/dates";
import { db } from "@/lib/db";

export type ModelSummary = {
  slug: string;
  name: string;
  photos: string[];
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
      photos: true,
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
