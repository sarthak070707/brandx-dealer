import type { z } from "zod";
import { fieldErrorsOf } from "@/lib/admin/field-errors";
import { accessorySchema, exShowroomSchema, insuranceSchema, roadTaxSchema } from "@/lib/admin/price-schemas";
import type { PriceTableId } from "@/lib/admin/price-tables";
import { canEndEarly, dayBefore, findOverlaps, overlapMessage } from "@/lib/admin/validity";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";

// endEarlier is the date the old row would end on, set when the screen can offer to do that.
export type SaveResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string>; endEarlier?: string };

const GONE = { ok: false, error: "This row no longer exists. Reload the page." } as const;
const OK = { ok: true } as const;

function invalid(error: z.ZodError): SaveResult {
  return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrorsOf(error) };
}

type Rival = { id: string; validFrom: Date; validTo: Date; slabMinPaise?: number; slabMaxPaise?: number | null };

type Outcome = { refusal: SaveResult } | { endFirst: Rival } | null;

// Two rows for the same thing must never apply on the same day. When the only row in the way began
// earlier, the admin may choose to end it the day before the new one starts.
function overlapOutcome(candidate: Omit<Rival, "id">, rivals: Rival[], editing: string | null, mayEndEarlier: boolean): Outcome {
  const clashes = findOverlaps(candidate, rivals.filter((rival) => rival.id !== editing));
  const [clash] = clashes;
  if (!clash) return null;

  const endable = clashes.length === 1 && canEndEarly(clash, candidate);
  if (endable && mayEndEarlier) return { endFirst: clash };
  return {
    refusal: { ok: false, error: overlapMessage(clash, endable), ...(endable && { endEarlier: formatDate(dayBefore(candidate.validFrom)) }) },
  };
}

// Saves one row of a price table. The key columns (which variant, which city) are fixed once a
// row exists, so an edit can only change its figures and dates, whatever the browser sends.
export async function savePriceRow(table: PriceTableId, input: unknown, endEarlier = false): Promise<SaveResult> {
  switch (table) {
    case "ex-showroom": {
      const parsed = exShowroomSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const { id, exShowroom, validFrom, validTo, ...rest } = parsed.data;
      const existing = id ? await db.variantPrice.findUnique({ where: { id } }) : null;
      if (id && !existing) return GONE;
      const variantId = existing?.variantId ?? rest.variantId;

      const outcome = overlapOutcome({ validFrom, validTo }, await db.variantPrice.findMany({ where: { variantId } }), id, endEarlier);
      if (outcome && "refusal" in outcome) return outcome.refusal;
      const data = { exShowroomPaise: exShowroom, validFrom, validTo };
      await db.$transaction([
        ...(outcome ? [db.variantPrice.update({ where: { id: outcome.endFirst.id }, data: { validTo: dayBefore(validFrom) } })] : []),
        id ? db.variantPrice.update({ where: { id }, data }) : db.variantPrice.create({ data: { ...data, variantId } }),
      ]);
      return OK;
    }
    case "road-tax": {
      const parsed = roadTaxSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const { id, slabMin, slabMax, rate, validFrom, validTo, ...rest } = parsed.data;
      const existing = id ? await db.roadTaxRule.findUnique({ where: { id } }) : null;
      if (id && !existing) return GONE;
      const { cityId, fuel } = existing ?? rest;

      const rivals = await db.roadTaxRule.findMany({ where: { cityId, fuel } });
      const outcome = overlapOutcome({ validFrom, validTo, slabMinPaise: slabMin, slabMaxPaise: slabMax }, rivals, id, endEarlier);
      if (outcome && "refusal" in outcome) return outcome.refusal;
      const data = { slabMinPaise: slabMin, slabMaxPaise: slabMax, rateBasisPoints: rate, validFrom, validTo };
      await db.$transaction([
        ...(outcome ? [db.roadTaxRule.update({ where: { id: outcome.endFirst.id }, data: { validTo: dayBefore(validFrom) } })] : []),
        id ? db.roadTaxRule.update({ where: { id }, data }) : db.roadTaxRule.create({ data: { ...data, cityId, fuel } }),
      ]);
      return OK;
    }
    case "insurance": {
      const parsed = insuranceSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const { id, premium, validFrom, validTo, ...rest } = parsed.data;
      const existing = id ? await db.insuranceRate.findUnique({ where: { id } }) : null;
      if (id && !existing) return GONE;
      const { variantId, cityId } = existing ?? rest;

      const rivals = await db.insuranceRate.findMany({ where: { variantId, cityId } });
      const outcome = overlapOutcome({ validFrom, validTo }, rivals, id, endEarlier);
      if (outcome && "refusal" in outcome) return outcome.refusal;
      const data = { premiumPaise: premium, validFrom, validTo };
      await db.$transaction([
        ...(outcome ? [db.insuranceRate.update({ where: { id: outcome.endFirst.id }, data: { validTo: dayBefore(validFrom) } })] : []),
        id ? db.insuranceRate.update({ where: { id }, data }) : db.insuranceRate.create({ data: { ...data, variantId, cityId } }),
      ]);
      return OK;
    }
    case "accessories": {
      const parsed = accessorySchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const { id, name, price, items, validFrom, validTo, ...rest } = parsed.data;
      const existing = id ? await db.accessoryPackage.findUnique({ where: { id } }) : null;
      if (id && !existing) return GONE;
      const modelId = existing?.modelId ?? rest.modelId;

      const outcome = overlapOutcome({ validFrom, validTo }, await db.accessoryPackage.findMany({ where: { modelId } }), id, endEarlier);
      if (outcome && "refusal" in outcome) return outcome.refusal;
      const data = { name, pricePaise: price, items, validFrom, validTo };
      await db.$transaction([
        ...(outcome ? [db.accessoryPackage.update({ where: { id: outcome.endFirst.id }, data: { validTo: dayBefore(validFrom) } })] : []),
        id ? db.accessoryPackage.update({ where: { id }, data }) : db.accessoryPackage.create({ data: { ...data, modelId } }),
      ]);
      return OK;
    }
  }
}

export async function deletePriceRow(table: PriceTableId, id: string): Promise<SaveResult> {
  const where = { id };
  // deleteMany answers "nothing to delete" with a count of 0 instead of throwing.
  const { count } = await {
    "ex-showroom": () => db.variantPrice.deleteMany({ where }),
    "road-tax": () => db.roadTaxRule.deleteMany({ where }),
    insurance: () => db.insuranceRate.deleteMany({ where }),
    accessories: () => db.accessoryPackage.deleteMany({ where }),
  }[table]();
  return count === 0 ? GONE : OK;
}
