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

// A normal price change: the old row began earlier and the new one takes over from its start date.
// Ending the old row the day before then loses none of the old row's earlier days, and nothing of
// its later days, because the new row covers them.
export const canEndEarly = (clash: Validity, candidate: Validity) =>
  clash.validFrom < candidate.validFrom && clash.validTo <= candidate.validTo;

export const overlapMessage = ({ validFrom, validTo }: Validity, canEnd: boolean) =>
  `Overlaps a row valid ${formatDate(validFrom)} to ${formatDate(validTo)}. ` +
  (canEnd ? "You can end that row the day before this one starts." : "Change one of the two so the dates don't overlap.");
