import type { z } from "zod";
import { fieldErrorsOf } from "@/lib/admin/field-errors";
import { accessorySchema, exShowroomSchema, insuranceSchema, roadTaxSchema } from "@/lib/admin/price-schemas";
import type { PriceTableId } from "@/lib/admin/price-tables";
import { dayAfter, dayBefore, findOverlaps, overlapMessage, overlapResolution, resolutionLabel, type Resolution } from "@/lib/admin/validity";
import { db } from "@/lib/db";

// resolution is set when the screen can offer a button that settles the overlap, with the button's text.
export type SaveResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; resolution?: { kind: Resolution; label: string } };

const GONE = { ok: false, error: "This row no longer exists. Reload the page." } as const;
const OK = { ok: true } as const;

function invalid(error: z.ZodError): SaveResult {
  return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrorsOf(error) };
}

type Rival = { id: string; validFrom: Date; validTo: Date; slabMinPaise?: number; slabMaxPaise?: number | null };

type Outcome = { refusal: SaveResult } | { clash: Rival; kind: Resolution; candidate: Omit<Rival, "id"> } | null;

// Two rows for the same thing must never apply on the same day. When exactly one row is in the way
// and the admin has chosen the way to settle it that fits, that row is changed in the same save.
function overlapOutcome(candidate: Omit<Rival, "id">, rivals: Rival[], editing: string | null, chosen: Resolution | undefined): Outcome {
  const clashes = findOverlaps(candidate, rivals.filter((rival) => rival.id !== editing));
  const [clash] = clashes;
  if (!clash) return null;

  const kind = clashes.length === 1 ? overlapResolution(clash, candidate) : null;
  // The choice only counts if it is the one that fits, so a forged request can't do anything else.
  if (kind && kind === chosen) return { clash, kind, candidate };
  return { refusal: { ok: false, error: overlapMessage(clash, kind), ...(kind && { resolution: { kind, label: resolutionLabel(kind, candidate) } }) } };
}

type DateChange = { validFrom?: Date; validTo?: Date };

// Changing or deleting the row in the way, for each of the four tables.
const ROW_OPS = {
  "ex-showroom": {
    change: (id: string, data: DateChange) => db.variantPrice.update({ where: { id }, data }),
    remove: (id: string) => db.variantPrice.delete({ where: { id } }),
  },
  "road-tax": {
    change: (id: string, data: DateChange) => db.roadTaxRule.update({ where: { id }, data }),
    remove: (id: string) => db.roadTaxRule.delete({ where: { id } }),
  },
  insurance: {
    change: (id: string, data: DateChange) => db.insuranceRate.update({ where: { id }, data }),
    remove: (id: string) => db.insuranceRate.delete({ where: { id } }),
  },
  accessories: {
    change: (id: string, data: DateChange) => db.accessoryPackage.update({ where: { id }, data }),
    remove: (id: string) => db.accessoryPackage.delete({ where: { id } }),
  },
};

// The write that settles the row in the way, run in the same transaction as the save.
function settleClash(table: PriceTableId, { clash, kind, candidate }: Extract<NonNullable<Outcome>, { clash: Rival }>) {
  const rows = ROW_OPS[table];
  if (kind === "replace") return rows.remove(clash.id);
  return rows.change(clash.id, kind === "end-early" ? { validTo: dayBefore(candidate.validFrom) } : { validFrom: dayAfter(candidate.validTo) });
}

// Saves one row of a price table. The key columns (which variant, which city) are fixed once a
// row exists, so an edit can only change its figures and dates, whatever the browser sends.
export async function savePriceRow(table: PriceTableId, input: unknown, resolution?: Resolution): Promise<SaveResult> {
  switch (table) {
    case "ex-showroom": {
      const parsed = exShowroomSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const { id, exShowroom, validFrom, validTo, ...rest } = parsed.data;
      const existing = id ? await db.variantPrice.findUnique({ where: { id } }) : null;
      if (id && !existing) return GONE;
      const variantId = existing?.variantId ?? rest.variantId;

      const outcome = overlapOutcome({ validFrom, validTo }, await db.variantPrice.findMany({ where: { variantId } }), id, resolution);
      if (outcome && "refusal" in outcome) return outcome.refusal;
      const data = { exShowroomPaise: exShowroom, validFrom, validTo };
      await db.$transaction([
        ...(outcome ? [settleClash(table, outcome)] : []),
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
      const outcome = overlapOutcome({ validFrom, validTo, slabMinPaise: slabMin, slabMaxPaise: slabMax }, rivals, id, resolution);
      if (outcome && "refusal" in outcome) return outcome.refusal;
      const data = { slabMinPaise: slabMin, slabMaxPaise: slabMax, rateBasisPoints: rate, validFrom, validTo };
      await db.$transaction([
        ...(outcome ? [settleClash(table, outcome)] : []),
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
      const outcome = overlapOutcome({ validFrom, validTo }, rivals, id, resolution);
      if (outcome && "refusal" in outcome) return outcome.refusal;
      const data = { premiumPaise: premium, validFrom, validTo };
      await db.$transaction([
        ...(outcome ? [settleClash(table, outcome)] : []),
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

      const outcome = overlapOutcome({ validFrom, validTo }, await db.accessoryPackage.findMany({ where: { modelId } }), id, resolution);
      if (outcome && "refusal" in outcome) return outcome.refusal;
      const data = { name, pricePaise: price, items, validFrom, validTo };
      await db.$transaction([
        ...(outcome ? [settleClash(table, outcome)] : []),
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
