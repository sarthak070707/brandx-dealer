import { describe, expect, it } from "vitest";
import { maskPhone } from "./mask-phone";

describe("maskPhone", () => {
  it("keeps the country code and the last three digits", () => {
    expect(maskPhone("+919876543210")).toBe("+91 ••••• ••210");
  });

  it("hides anything it does not recognise instead of showing it", () => {
    for (const phone of ["", "9876543210", "+1 555 0100"]) expect(maskPhone(phone)).toBe("this number");
  });
});
