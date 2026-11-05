import type { z } from "zod";

// One message per field, named by the input, so the screen can show it beside the control.
export function fieldErrorsOf(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return fieldErrors;
}
