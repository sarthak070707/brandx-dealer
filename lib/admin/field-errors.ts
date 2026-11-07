import type { z } from "zod";

// One message per field, named by the input, so the screen can show it beside the control.
export function fieldErrorsOf(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return fieldErrors;
}

// Like fieldErrorsOf, but keyed by the whole path ("variants.0.engine"), for forms that hold lists.
export function pathErrorsOf(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
  return fieldErrors;
}
