import { describe, expect, it } from "vitest";
import { serviceBookingSchema } from "./schema";

const valid = {
  buyerName: "Meena Kapoor",
  buyerPhone: "98765 43210",
  language: "HI",
  consent: true,
  showroomId: "s1",
  slotStart: "2026-11-12T05:30:00.000Z",
  serviceType: "PERIODIC",
  vehicle: "Maruti Swift VXi",
  regNumber: " up32 ab-1234 ",
  km: "62000",
  notes: "",
};
const keysFor = (input: unknown) => {
  const result = serviceBookingSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
};

describe("serviceBookingSchema", () => {
  it("accepts a complete booking and tidies the registration, phone, distance and notes", () => {
    const parsed = serviceBookingSchema.parse(valid);
    expect(parsed).toMatchObject({ regNumber: "UP32AB1234", buyerPhone: "+919876543210", km: 62_000, notes: null, serviceType: "PERIODIC" });
    expect(parsed.slotStart).toEqual(new Date("2026-11-12T05:30:00.000Z"));
  });

  it("gives a key for each problem, so the page can show it in the buyer's language", () => {
    expect(
      keysFor({ ...valid, buyerName: "M", buyerPhone: "1", consent: false, showroomId: "", slotStart: "tomorrow", serviceType: "WASH", vehicle: "", regNumber: "1234", km: "lots" }),
    ).toEqual({
      buyerName: "name",
      buyerPhone: "phone",
      consent: "consent",
      showroomId: "showroom",
      slotStart: "slotUnavailable",
      serviceType: "serviceType",
      vehicle: "yourCar",
      regNumber: "regNumber",
      km: "tradeKm",
    });
  });

  it("limits the notes like every other form", () => {
    expect(keysFor({ ...valid, notes: "x".repeat(501) })).toEqual({ notes: "messageTooLong" });
  });
});
