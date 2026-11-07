import { z } from "zod";

// The admin forms send everything as text, so these turn the text into numbers with a clear message.
export function wholeNumber(min: number, max: number) {
  const message = `Enter a whole number from ${min} to ${max}`;
  return z.string().trim().regex(/^\d{1,7}$/, message).transform(Number).pipe(z.number().min(min, message).max(max, message));
}

export function decimalNumber(min: number, max: number) {
  const message = `Enter a number from ${min} to ${max}, like 17.5`;
  return z.string().trim().regex(/^\d{1,2}(\.\d)?$/, message).transform(Number).pipe(z.number().min(min, message).max(max, message));
}
