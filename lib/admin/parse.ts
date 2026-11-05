import { z } from "zod";

// The paise columns are 32-bit integers, so the largest amount they can hold is about ₹2.14 crore.
const MAX_RUPEES = 2_00_00_000;
const MAX_BASIS_POINTS = 10_000;

// Admins type whole rupees, with or without ₹ and commas: "12,45,000" becomes 124500000 paise.
export function parseRupees(text: string) {
  const digits = text.replace(/[₹,\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const rupees = Number(digits);
  return rupees > MAX_RUPEES ? null : rupees * 100;
}

// A percentage with up to two decimals: "10" becomes 1000 basis points, "8.5" becomes 850.
export function parsePercent(text: string) {
  const digits = text.replace(/[%\s]/g, "");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(digits)) return null;
  const basisPoints = Math.round(Number(digits) * 100);
  return basisPoints > MAX_BASIS_POINTS ? null : basisPoints;
}

export const paiseToRupeesText = (paise: number) => String(Math.round(paise / 100));
export const basisPointsToPercentText = (basisPoints: number) => String(basisPoints / 100);
export const dateToInputText = (date: Date) => date.toISOString().slice(0, 10);

const RUPEES_MESSAGE = "Enter a whole number of rupees, up to ₹2 crore";

// NaN is how a bad value reaches z.number(), which turns it into the message above.
export const rupeesField = z.string().trim().transform((text) => parseRupees(text) ?? Number.NaN).pipe(z.number(RUPEES_MESSAGE));

export const positiveRupeesField = rupeesField.refine((paise) => paise > 0, "Enter an amount above zero");

export const optionalRupeesField = z
  .string()
  .trim()
  .transform((text) => (text === "" ? null : (parseRupees(text) ?? Number.NaN)))
  .pipe(z.number(RUPEES_MESSAGE).nullable());

export const percentField = z
  .string()
  .trim()
  .transform((text) => parsePercent(text) ?? Number.NaN)
  .pipe(z.number("Enter a percentage from 0 to 100, like 10 or 8.5"));

// Postgres DATE columns are read as midnight UTC.
export const dateField = z.iso.date("Pick a date").transform((value) => new Date(`${value}T00:00:00Z`));
