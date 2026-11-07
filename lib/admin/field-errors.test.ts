import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fieldErrorsOf, pathErrorsOf } from "./field-errors";

const schema = z.object({ name: z.string().min(2, "Too short"), items: z.array(z.object({ qty: z.number().min(1, "At least 1") })) });
const failure = schema.safeParse({ name: "x", items: [{ qty: 5 }, { qty: 0 }] });

describe("field errors", () => {
  it("fieldErrorsOf keys each message by its top-level field", () => {
    expect(failure.success ? null : fieldErrorsOf(failure.error)).toEqual({ name: "Too short", items: "At least 1" });
  });

  it("pathErrorsOf keys each message by the whole path, so a list item can be pointed at", () => {
    expect(failure.success ? null : pathErrorsOf(failure.error)).toEqual({ name: "Too short", "items.1.qty": "At least 1" });
  });
});
