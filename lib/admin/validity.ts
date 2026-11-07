import { formatDate } from "@/lib/dates";

export type Validity = { validFrom: Date; validTo: Date };
export type ValidityStatus = "current" | "upcoming" | "expired";
type Slab = { slabMinPaise?: number; slabMaxPaise?: number | null };

export function validityStatus({ validFrom, validTo }: Validity, today: Date): ValidityStatus {
  if (validTo < today) return "expired";
  return validFrom > today ? "upcoming" : "current";
}

// Both ends count as valid days, so a row that ends on the day another starts overlaps it.
const validitiesOverlap = (a: Validity, b: Validity) => a.validFrom <= b.validTo && b.validFrom <= a.validTo;

// Half-open slabs (A4): [min, max), no max meaning unlimited. Tables without slabs always "overlap" here.
const slabsOverlap = (a: Slab, b: Slab) =>
  (a.slabMinPaise ?? 0) < (b.slabMaxPaise ?? Infinity) && (b.slabMinPaise ?? 0) < (a.slabMaxPaise ?? Infinity);

// Every other row that applies on any of the same days as the new one.
export function findOverlaps<T extends Validity & Slab>(candidate: Validity & Slab, siblings: T[]) {
  return siblings.filter((sibling) => validitiesOverlap(candidate, sibling) && slabsOverlap(candidate, sibling));
}

// Two rows for the same thing must not apply on the same day, or the price would be ambiguous.
export const findOverlap = <T extends Validity & Slab>(candidate: Validity & Slab, siblings: T[]) => findOverlaps(candidate, siblings)[0];

const DAY_MS = 24 * 60 * 60_000;
export const dayBefore = (date: Date) => new Date(date.getTime() - DAY_MS);
export const dayAfter = (date: Date) => new Date(date.getTime() + DAY_MS);

// How the one row in the way can be settled, so that no day of it that the new row doesn't cover is lost:
// - end-early: it began earlier, so it ends the day before the new row starts (a normal price change).
// - start-later: it runs on past the new row, so it starts the day after the new row ends.
// - replace: the new row covers all of it, so it goes.
// Nothing fits when the new row sits strictly inside it, because that would split it in two.
export const RESOLUTIONS = ["end-early", "start-later", "replace"] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

export function overlapResolution(clash: Validity, candidate: Validity): Resolution | null {
  if (clash.validFrom < candidate.validFrom) return clash.validTo <= candidate.validTo ? "end-early" : null;
  return clash.validTo <= candidate.validTo ? "replace" : "start-later";
}

export const overlapMessage = ({ validFrom, validTo }: Validity, resolution: Resolution | null) => {
  const dates = `Overlaps a row valid ${formatDate(validFrom)} to ${formatDate(validTo)}. `;
  switch (resolution) {
    case "end-early":
      return `${dates}You can end that row the day before this one starts.`;
    case "start-later":
      return `${dates}You can start that row the day after this one ends.`;
    case "replace":
      return `${dates}This row covers all of it, so it can replace it.`;
    default:
      return `${dates}Change one of the two so the dates don't overlap.`;
  }
};

// The text of the button that settles the overlap, naming the date it will use.
export function resolutionLabel(resolution: Resolution, { validFrom, validTo }: Validity) {
  switch (resolution) {
    case "end-early":
      return `End that row on ${formatDate(dayBefore(validFrom))} and save this one`;
    case "start-later":
      return `Start that row on ${formatDate(dayAfter(validTo))} and save this one`;
    case "replace":
      return "Replace that row with this one";
  }
}
