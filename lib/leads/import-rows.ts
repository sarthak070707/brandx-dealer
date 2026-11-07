import type { LeadRecord } from "@/lib/leads/csv";
import { indianMobile } from "@/lib/validation";

export const MAX_IMPORT_ROWS = 500;
// Two leads for the same buyer and car this close together count as one.
export const DUPLICATE_WINDOW_DAYS = 14;

type Named = { id: string; name: string };
export type ImportContext = {
  models: Named[];
  cities: Named[];
  showrooms: (Named & { cityId: string })[];
  // The showroom for rows that don't name one; a consultant's own showroom is the only one they can use.
  defaultShowroomId: string | null;
  lockedToDefault: boolean;
  now: Date;
};

export type ImportLead = {
  buyerName: string;
  buyerPhone: string;
  modelId?: string;
  showroomId: string;
  cityId: string;
  message?: string;
  createdAt: Date;
};

export type RowOutcome = {
  line: number;
  name: string;
  phone: string;
  car: string;
  status: "ready" | "duplicate" | "invalid";
  problem: string | null;
  lead: ImportLead | null;
};

// "Model H ZX" or "H, Model H" mean Model H: the longest model name found in the text wins.
export function matchModel(text: string, models: Named[]) {
  const lowered = text.toLowerCase();
  return [...models].sort((a, b) => b.name.length - a.name.length).find((model) => lowered.includes(model.name.toLowerCase())) ?? null;
}

// The date a buyer first asked: 2026-11-07, 07-11-2026 or 07/11/2026 (day first, as in India).
// Empty means "now"; a date in the future counts as now; anything else is not understood.
export function parseReceived(text: string, now: Date): Date | null | "invalid" {
  const value = text.trim();
  if (value === "") return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const dayFirst = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(value);
  const parts = iso ? { year: +iso[1], month: +iso[2], day: +iso[3] } : dayFirst ? { year: +dayFirst[3], month: +dayFirst[2], day: +dayFirst[1] } : null;
  if (!parts) return "invalid";
  const { year, month, day } = parts;

  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!real) return "invalid";
  return date > now ? now : date;
}

function chooseShowroom(record: LeadRecord, context: ImportContext) {
  const byId = (id: string | null) => context.showrooms.find((showroom) => showroom.id === id) ?? null;
  if (context.lockedToDefault) return byId(context.defaultShowroomId);

  const named = context.showrooms.find((showroom) => showroom.name.toLowerCase() === record.showroom.toLowerCase());
  if (named) return named;
  const city = context.cities.find((option) => option.name.toLowerCase() === record.city.toLowerCase());
  return (city && context.showrooms.find((showroom) => showroom.cityId === city.id)) || byId(context.defaultShowroomId);
}

// Checks every row on its own and against the rows before it. Nothing here touches the database.
export function checkRows(records: LeadRecord[], context: ImportContext): RowOutcome[] {
  const seen = new Set<string>();

  return records.map((record) => {
    const base = { line: record.line, name: record.name, phone: record.phone, car: record.car };
    const rejected = (problem: string): RowOutcome => ({ ...base, status: "invalid", problem, lead: null });

    if (record.name.length < 2) return rejected("The name is missing");
    const phone = indianMobile.safeParse(record.phone);
    if (!phone.success) return rejected("The phone number isn't a valid Indian mobile number");
    const received = parseReceived(record.received, context.now);
    if (received === "invalid") return rejected("The date isn't understood. Use DD-MM-YYYY, like 07-11-2026");
    const showroom = chooseShowroom(record, context);
    if (!showroom) return rejected("There is no showroom for this row");

    const model = matchModel(record.car, context.models);
    const key = `${phone.data}|${model?.id ?? ""}`;
    if (seen.has(key)) return { ...base, status: "duplicate", problem: "The same phone number and car appear earlier in the file", lead: null };
    seen.add(key);

    // A car we don't sell (or can't match) is kept in the message rather than lost.
    const interest = record.car && !model ? `Interested in: ${record.car}.` : "";
    return {
      ...base,
      phone: phone.data,
      status: "ready",
      problem: null,
      lead: {
        buyerName: record.name,
        buyerPhone: phone.data,
        modelId: model?.id,
        showroomId: showroom.id,
        cityId: showroom.cityId,
        message: [interest, record.message].filter(Boolean).join(" ") || undefined,
        createdAt: received ?? context.now,
      },
    };
  });
}

// Rows for a buyer who already has a lead for the same car at around the same time (within two weeks of
// the date on the row) are skipped, so importing the same file twice adds nothing. A buyer who asks
// about the same car months later is a new lead.
export function markExistingDuplicates(outcomes: RowOutcome[], existing: { buyerPhone: string; modelId: string | null; createdAt: Date }[]): RowOutcome[] {
  const windowMs = DUPLICATE_WINDOW_DAYS * 24 * 60 * 60_000;
  return outcomes.map((outcome) => {
    const lead = outcome.lead;
    const duplicate =
      outcome.status === "ready" &&
      lead &&
      existing.some(
        (other) => other.buyerPhone === lead.buyerPhone && (other.modelId ?? "") === (lead.modelId ?? "") && Math.abs(other.createdAt.getTime() - lead.createdAt.getTime()) <= windowMs,
      );
    return duplicate
      ? { ...outcome, status: "duplicate", problem: "This buyer already has a lead for this car from around the same time", lead: null }
      : outcome;
  });
}

export function summarise(outcomes: RowOutcome[]) {
  return {
    ready: outcomes.filter((outcome) => outcome.status === "ready").length,
    duplicate: outcomes.filter((outcome) => outcome.status === "duplicate").length,
    invalid: outcomes.filter((outcome) => outcome.status === "invalid").length,
  };
}
