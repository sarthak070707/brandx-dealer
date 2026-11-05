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

// Two rows for the same thing must not apply on the same day, or the price would be ambiguous.
export function findOverlap<T extends Validity & Slab>(candidate: Validity & Slab, siblings: T[]) {
  return siblings.find((sibling) => validitiesOverlap(candidate, sibling) && slabsOverlap(candidate, sibling));
}

export const overlapMessage = ({ validFrom, validTo }: Validity) =>
  `Overlaps another row valid ${formatDate(validFrom)} to ${formatDate(validTo)}. End or move that row first.`;
