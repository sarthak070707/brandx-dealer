import { describe, expect, it } from "vitest";
import { enquirySchema, MAX_MESSAGE_LENGTH } from "./enquiry-schema";

const valid = {
  buyerName: "Asha Rao",
  buyerPhone: "98765 43210",
  language: "HI",
  consent: true,
  message: "  Is it available in white?  ",
  target: { type: "model", modelSlug: "model-h", variantId: "v1", cityId: "c1", showroomId: "s1" },
};

describe("enquirySchema", () => {
  it("accepts an enquiry about a new car and tidies the message", () => {
    const parsed = enquirySchema.parse(valid);
    expect(parsed.message).toBe("Is it available in white?");
    expect(parsed.buyerPhone).toBe("+919876543210");
  });

  it("accepts an enquiry about a used car, with the message left out", () => {
    const parsed = enquirySchema.parse({ ...valid, message: "", target: { type: "used", stockId: "UC-1182" } });
    expect(parsed.message).toBeNull();
  });

  it("refuses an enquiry without consent", () => {
    expect(enquirySchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("refuses an over-long message", () => {
    expect(enquirySchema.safeParse({ ...valid, message: "x".repeat(MAX_MESSAGE_LENGTH + 1) }).success).toBe(false);
  });

  it("refuses an unknown kind of target", () => {
    expect(enquirySchema.safeParse({ ...valid, target: { type: "service", id: "x" } }).success).toBe(false);
  });
});
