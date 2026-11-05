import { basisPointsToPercentText, dateToInputText, paiseToRupeesText } from "@/lib/admin/parse";
import type { PriceTableId } from "@/lib/admin/price-tables";
import { validityStatus, type ValidityStatus } from "@/lib/admin/validity";
import { indiaToday } from "@/lib/dates";
import { db } from "@/lib/db";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";

export type Option = { value: string; label: string };
// Everything is text, because that is what the inputs hold; the server parses it back on save.
export type PriceRowView = { id: string; keys: Record<string, string>; values: Record<string, string>; status: ValidityStatus };
export type PriceTableData = { rows: PriceRowView[]; keyOptions: Record<string, Option[]> };

type Dated = { validFrom: Date; validTo: Date };
const validityValues = ({ validFrom, validTo }: Dated) => ({ validFrom: dateToInputText(validFrom), validTo: dateToInputText(validTo) });

async function variantOptions(): Promise<Option[]> {
  const variants = await db.variant.findMany({
    orderBy: [{ model: { name: "asc" } }, { code: "asc" }],
    select: { id: true, name: true, fuel: true, transmission: true, model: { select: { name: true } } },
  });
  return variants.map((variant) => ({
    value: variant.id,
    label: `${variant.model.name} ${variant.name}, ${TRANSMISSION_LABEL[variant.transmission]}, ${FUEL_LABEL[variant.fuel]}`,
  }));
}

const cityOptions = async (): Promise<Option[]> =>
  (await db.city.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })).map((city) => ({ value: city.id, label: city.name }));

const modelOptions = async (): Promise<Option[]> =>
  (await db.model.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })).map((model) => ({ value: model.id, label: model.name }));

const fuelOptions: Option[] = Object.entries(FUEL_LABEL).map(([value, label]) => ({ value, label }));

// Every version of every row, expired and upcoming included, grouped by what it prices.
export async function getPriceTable(table: PriceTableId): Promise<PriceTableData> {
  const today = indiaToday(new Date());
  const row = (id: string, dates: Dated, keys: Record<string, string>, values: Record<string, string>): PriceRowView => ({
    id,
    keys,
    values: { ...values, ...validityValues(dates) },
    status: validityStatus(dates, today),
  });

  const build = async (): Promise<PriceTableData> => {
    switch (table) {
      case "ex-showroom": {
        const [rows, variants] = await Promise.all([db.variantPrice.findMany(), variantOptions()]);
        return {
          keyOptions: { variantId: variants },
          rows: rows.map((r) => row(r.id, r, { variantId: r.variantId }, { exShowroom: paiseToRupeesText(r.exShowroomPaise) })),
        };
      }
      case "road-tax": {
        const [rows, cities] = await Promise.all([db.roadTaxRule.findMany(), cityOptions()]);
        return {
          keyOptions: { cityId: cities, fuel: fuelOptions },
          rows: rows.map((r) =>
            row(r.id, r, { cityId: r.cityId, fuel: r.fuel }, {
              slabMin: paiseToRupeesText(r.slabMinPaise),
              slabMax: r.slabMaxPaise === null ? "" : paiseToRupeesText(r.slabMaxPaise),
              rate: basisPointsToPercentText(r.rateBasisPoints),
            }),
          ),
        };
      }
      case "insurance": {
        const [rows, variants, cities] = await Promise.all([db.insuranceRate.findMany(), variantOptions(), cityOptions()]);
        return {
          keyOptions: { variantId: variants, cityId: cities },
          rows: rows.map((r) => row(r.id, r, { variantId: r.variantId, cityId: r.cityId }, { premium: paiseToRupeesText(r.premiumPaise) })),
        };
      }
      case "accessories": {
        const [rows, models] = await Promise.all([db.accessoryPackage.findMany(), modelOptions()]);
        return {
          keyOptions: { modelId: models },
          rows: rows.map((r) => row(r.id, r, { modelId: r.modelId }, { name: r.name, price: paiseToRupeesText(r.pricePaise), items: r.items.join(", ") })),
        };
      }
    }
  };

  const { rows, keyOptions } = await build();
  const rank = (view: PriceRowView) => Object.entries(view.keys).map(([name, value]) => keyOptions[name]?.find((option) => option.value === value)?.label ?? value).join(" ");
  // By what it prices, then newest first, so the row in force sits on top of its history.
  return { keyOptions, rows: rows.toSorted((a, b) => rank(a).localeCompare(rank(b)) || b.values.validFrom.localeCompare(a.values.validFrom)) };
}

